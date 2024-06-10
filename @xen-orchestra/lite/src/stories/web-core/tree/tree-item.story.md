# Example

```vue-template
<TreeItem>
  <TreeItemLabel :icon="faServer" route="#">Host</TreeItemLabel>
  <template #sublist>
    <TreeList>
      <TreeItem>
        <TreeItemLabel no-indent route="#">Sublist goes here</TreeItemLabel>
      </TreeItem>
    </TreeList>
  </template>
</TreeItem>
```

```vue-script
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
```
