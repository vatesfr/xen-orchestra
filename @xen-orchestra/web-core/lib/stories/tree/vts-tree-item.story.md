# Example

```vue-template
<VtsTreeItem>
  <UiTreeItemLabel :icon="faServer" route="dashboard">Host</UiTreeItemLabel>
  <template #sublist>
    <VtsTreeList>
      <VtsTreeItem>
        <UiTreeItemLabel no-indent route="#">Sublist goes here</UiTreeItemLabel>
      </VtsTreeItem>
    </VtsTreeList>
  </template>
</VtsTreeItem>
```

```vue-script
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
```
