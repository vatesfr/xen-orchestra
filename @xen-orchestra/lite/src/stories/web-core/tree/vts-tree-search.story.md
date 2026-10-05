Search input to filter a treeview. It is meant to be placed in the `subheader` slot of `VtsLayoutSidebar`.

# Example

```vue-template
<VtsLayoutSidebar>
  <template #subheader>
    <VtsTreeSearch v-model="filter" />
  </template>
  <VtsTreeList>
    <!-- tree items filtered with `filter` -->
  </VtsTreeList>
</VtsLayoutSidebar>
```
