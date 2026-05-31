const fs = require('fs');
const path = require('path');

const componentViewSource = fs.readFileSync(
  path.join(__dirname, '../../ios/RNCPickerComponentView.mm'),
  'utf8',
);

describe('RNCPickerComponentView iOS Fabric lifecycle', () => {
  it('opts out of Fabric recycling through the class-level hook React Native calls', () => {
    expect(componentViewSource).toContain('+ (BOOL)shouldBeRecycled');
    expect(componentViewSource).not.toContain('- (BOOL)shouldBeRecycled');
  });

  it('does not reset UIPickerView native state when picker props are unchanged', () => {
    expect(componentViewSource).toContain('static BOOL itemsAreEqual');
    expect(componentViewSource).toContain(
      'const auto &oldPickerProps = static_cast<const RNCPickerProps &>(*_props);',
    );
    expect(componentViewSource).toContain(
      'if (!itemsAreEqual(newProps.items, oldPickerProps.items))',
    );
    expect(componentViewSource).toContain(
      'if (picker.selectedIndex != newProps.selectedIndex)',
    );
    expect(componentViewSource).toContain(
      'if (picker.numberOfLines != newProps.numberOfLines)',
    );
  });
});
