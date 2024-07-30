```vue-template
<SearchBar @search="(value: string) => (filter = value)" />

<ul>
  <li v-for="vm in vms" :key="vm.id">{{ vm.label }}</li>
</ul>
```

```vue-script
// Example with `defineTree` and `useTree` composables

const data = [
  {
    id: 'e8ec9a13-7b65-495e-2d90-224c17e02b67',
    name_label: '[Team XCPng] - Win X centers',
    power_state: 'Running',
  },
  {
    id: 'e40c1da3-918b-c173-506c-e8c2c069181f',
    name_label: 'AS-YA test VM pharpp_2023-10-30T15:03:17.071Z',
    power_state: 'Running',
  },
  {
    id: '989cd0ad-17f8-c198-15c6-8549da1f3b9f',
    name_label: 'BRS - XenServer 8',
    power_state: 'Running',
  },
  ...
]

// filter is used in the template `@search` handler
const { filter, predicate } = useTreeFilter()

const definitions = defineTree(data, {
  getLabel: 'name_label',
  predicate,
})

const { nodes: vms } = useTree(definitions, { expand: false })
```
