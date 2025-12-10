# Example

```vue-template
<VtsTreeList>
  <VtsTreeItem>
    <UiTreeItemLabel icon="fa:city" route="#">Pool</UiTreeItemLabel>
    <template #sublist>
      <VtsTreeList>
        <VtsTreeItem v-for="i of 3" :key="i">
          <UiTreeItemLabel icon="fa:server" route="#">
            Host - {{ i }}
            <template #addons>
              <VtsIcon v-if="i === 2" name="legacy:primary" size="medium" />
              <UiCounter accent="brand" value="3" variant="secondary" size="small" />
            </template>
          </UiTreeItemLabel>
          <template #sublist>
            <VtsTreeList>
              <VtsTreeItem v-for="j of 3" :key="j">
                <UiTreeItemLabel no-indent route="#">
                  <template #icon>
                    <VtsObjectIcon size="medium" :state="j === 3 ? 'halted' : 'running'" type="vm" />
                  </template>
                  VM {{ i }}.{{ j }}
                  <template #addons>
                    <VtsIcon v-if="j === 2" busy :name="undefined" size="medium" />
                    <UiButtonIcon accent="brand" size="small" icon="fa:ellipsis" />
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
