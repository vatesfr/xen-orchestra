<template>
  <ComponentStory :params>
    <VtsTreeList>
      <VtsTreeItem :expanded="flag.isFlagged('pool', 'expanded')">
        <UiTreeItemLabel :icon="faCity" route="dashboard" @toggle="flag.toggleFlag('pool', 'expanded')">
          Pool
        </UiTreeItemLabel>
        <template #sublist>
          <VtsTreeList>
            <VtsTreeItem v-for="i of 3" :key="i" :expanded="flag.isFlagged(`host-${i}`, 'expanded')">
              <UiTreeItemLabel :icon="faServer" route="dashboard" @toggle="flag.toggleFlag(`host-${i}`, 'expanded')">
                Host - {{ i }}
                <template #addons>
                  <VtsIcon v-if="i === 2" :icon="faStar" accent="warning" />
                  <UiCounter accent="brand" size="small" value="3" variant="secondary" />
                </template>
              </UiTreeItemLabel>
              <template #sublist>
                <VtsTreeList>
                  <VtsTreeItem v-for="j of 3" :key="j">
                    <UiTreeItemLabel no-indent route="dashboard">
                      <template #icon>
                        <UiObjectIcon :state="j === 3 ? 'halted' : 'running'" size="medium" type="vm" />
                      </template>
                      VM {{ i }}.{{ j }}
                      <template #addons>
                        <VtsIcon v-if="j === 2" accent="current" busy />
                        <UiButtonIcon :icon="faEllipsis" accent="brand" size="medium" />
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
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { useFlagRegistry } from '@core/packages/collection'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { faCity, faEllipsis, faServer, faStar } from '@fortawesome/free-solid-svg-icons'

const { params } = useStory({
  slots: {
    default: {},
  },
})

const flag = useFlagRegistry(['expanded'])
</script>
