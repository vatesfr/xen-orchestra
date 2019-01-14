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
### Properties
Name | Type | Default      | Description
------- | ---------------- | ---------- | ---------:
`options` | `Array` of Objects | | Specify the options that can be selected ans it's required. The properties `label` and `value` are required in the Object.
`multi`| `Boolean` | `false` |  Sllow to select multiple values.
`value` | `Object` or `Array` of Objects when `multi` is true |   | Control the current value and it's required.
`onChange` | `Function` | |  Canage the changed value. The function's arguments: selected value(s).
`optionRenderer`  | `Function` | | Manage option display. Parameter: an element of options.
`children` | | | How the component will be rendered. Will fallback to optionRenderer if not used.
