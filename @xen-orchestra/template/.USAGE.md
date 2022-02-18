Create a string replacer based on a pattern and a list of rules.

```js
const myReplacer = compileTemplate('{name}_COPY_{name}_{id}_%%', {
  '{name}': vm => vm.name_label,
  '{id}': vm => vm.id,
  '%': (_, i) => i,
})

const newString = myReplacer(
  {
    name_label: 'foo',
    id: 42,
  },
  32
)

newString === 'foo_COPY_{name}_42_32%' // true
```
