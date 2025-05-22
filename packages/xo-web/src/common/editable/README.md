## Select

### Usage

```js
<Select
  value={this.state.selectedOption}
  onChange={selectedOption => this.setState({ selectedOption })}
  optionRenderer={option => option.label}
  options={[
    { value: 'foo', label: 'Foo' },
    { value: 'bar', label: 'Bar' },
  ]}
/>
```

### Props

| Name             | Type                                                    | Default | Description                                                                                          |
| ---------------- | ------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `options`        | `Array` of `Object`s                                    |         | Required. Options that can be selected. `label` and `value` properties are required for each option. |
| `multi`          | `Boolean`                                               | `false` | Allow to select multiple values.                                                                     |
| `value`          | `Object` or `Array` of `Object`s when `multi` is `true` |         | Required. Current value.                                                                             |
| `onChange`       | `Function`                                              |         | Manage the changed value. Parameters: selected value(s).                                             |
| `optionRenderer` | `Function`                                              |         | Manage option display. Parameter: an element of `options`.                                           |
| `children`       |                                                         |         | How the component will be rendered. Will fall back to `optionRenderer` if not used.                  |
