# Example

```vue-template
<TreeList>
  <TreeItem>
    <TreeItemLabel :icon="faCity" route="#">Pool</TreeItemLabel>
    <template #sublist>
      <TreeList>
        <TreeItem v-for="i of 3" :key="i">
          <TreeItemLabel :icon="faServer" route="#">
            Host - {{ i }}
            <template #addons>
              <ButtonIcon v-if="i === 2" :icon="faStar" color="warning" />
              <VtsCounter accent="info" value="3" variant="secondary" size="small" />
            </template>
          </TreeItemLabel>
          <template #sublist>
            <TreeList>
              <TreeItem v-for="j of 3" :key="j">
                <TreeItemLabel no-indent route="#">
                  <template #icon>
                    <ObjectIcon :state="j === 3 ? 'halted' : 'running'" type="vm" />
                  </template>
                  VM {{ i }}.{{ j }}
                  <template #addons>
                    <VtsIcon v-if="j === 2" busy accent="current" />
                    <ButtonIcon :icon="faEllipsis" />
                  </template>
                </TreeItemLabel>
              </TreeItem>
            </TreeList>
          </template>
        </TreeItem>
      </TreeList>
    </template>
  </TreeItem>
</TreeList>
```

```vue-script
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import VtsCounter from '@core/components/counter/VtsCounter.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { faCity, faEllipsis, faServer, faStar } from '@fortawesome/free-solid-svg-icons'
```
