# Example

```vue-template
<VtsTreeList>
  <VtsTreeItem>
    <UiTreeItemLabel :icon="faCity" route="#">Pool</UiTreeItemLabel>
    <template #sublist>
      <VtsTreeList>
        <VtsTreeItem v-for="i of 3" :key="i">
          <UiTreeItemLabel :icon="faServer" route="#">
            Host - {{ i }}
            <template #addons>
              <VtsIcon v-if="i === 2" :icon="faStar" accent="warning" />
              <UiCounter accent="brand" value="3" variant="secondary" size="small" />
            </template>
          </UiTreeItemLabel>
          <template #sublist>
            <VtsTreeList>
              <VtsTreeItem v-for="j of 3" :key="j">
                <UiTreeItemLabel no-indent route="#">
                  <template #icon>
                    <UiObjectIcon size="medium" :state="j === 3 ? 'halted' : 'running'" type="vm" />
                  </template>
                  VM {{ i }}.{{ j }}
                  <template #addons>
                    <VtsIcon v-if="j === 2" busy accent="current" />
                    <UiButtonIcon accent="brand" size="medium" :icon="faEllipsis" />
                  </template>
                </UiTreeItemLabel>
              </VtsTreeItem>
            </VtsTreeList>
          </template>
        </VtsTreeItem>
      </VtsTreeList>
    </template>
  </VtsTreeItem>
</VtsTreeList>
```

```vue-script
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { faCity, faEllipsis, faServer, faStar } from '@fortawesome/free-solid-svg-icons'
```
