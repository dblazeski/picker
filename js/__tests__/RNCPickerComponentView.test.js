const fs = require('fs');
const path = require('path');

const componentViewSource = fs.readFileSync(
  path.join(__dirname, '../../ios/RNCPickerComponentView.mm'),
  'utf8',
);

const extractUpdatePropsBody = (source) => {
  const updatePropsStart = source.indexOf(
    '- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps',
  );
  const nextMethodStart = source.indexOf(
    '\n// already added',
    updatePropsStart,
  );

  if (updatePropsStart === -1 || nextMethodStart === -1) {
    throw new Error('RNCPickerComponentView updateProps method was not found');
  }

  return source.slice(updatePropsStart, nextMethodStart);
};

const hasClassMethod = (source, selector) =>
  new RegExp(`^\\+ \\(BOOL\\)${selector}$`, 'm').test(source);

const hasInstanceMethod = (source, selector) =>
  new RegExp(`^- \\(BOOL\\)${selector}$`, 'm').test(source);

const componentViewClassFromSource = (source) => ({
  shouldBeRecycled: hasClassMethod(source, 'shouldBeRecycled')
    ? () => false
    : undefined,
  prototype: {
    shouldBeRecycled: hasInstanceMethod(source, 'shouldBeRecycled')
      ? () => false
      : undefined,
  },
});

const reactNativeFabricShouldRecycle = (viewClass) =>
  typeof viewClass.shouldBeRecycled === 'function'
    ? viewClass.shouldBeRecycled()
    : true;

const updatePropsBody = extractUpdatePropsBody(componentViewSource);

describe('RNCPickerComponentView iOS Fabric lifecycle', () => {
  it('opts out of Fabric recycling through the class hook React Native calls', () => {
    const previousInstanceOnlyImplementation = {
      prototype: {
        shouldBeRecycled: () => false,
      },
    };

    expect(
      reactNativeFabricShouldRecycle(previousInstanceOnlyImplementation),
    ).toBe(true);
    expect(
      reactNativeFabricShouldRecycle(
        componentViewClassFromSource(componentViewSource),
      ),
    ).toBe(false);
  });

  it('does not reset UIPickerView native state when picker props are unchanged', () => {
    expect(updatePropsBody).toContain(
      'const auto &oldPickerProps = static_cast<const RNCPickerProps &>(*_props);',
    );
    expect(updatePropsBody).toContain(
      'if (!itemsAreEqual(newProps.items, oldPickerProps.items))',
    );
    expect(updatePropsBody).toContain(
      'if (picker.selectedIndex != newProps.selectedIndex)',
    );
    expect(updatePropsBody).toContain(
      'if (newProps.color != oldPickerProps.color)',
    );
    expect(updatePropsBody).toContain(
      'if (![textAlign isEqualToString:oldTextAlign])',
    );
    expect(updatePropsBody).toContain(
      'if (picker.numberOfLines != newProps.numberOfLines)',
    );
    expect(updatePropsBody).toContain(
      'newProps.fontFamily != oldPickerProps.fontFamily ||',
    );
  });
});
