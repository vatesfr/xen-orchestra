<template>
  <ComponentStory :params="[slot()]">
    <VtsTreeList>
      <VtsTreeItem>
        <UiTreeItemLabel :icon="faCity" route="dashboard">Pool</UiTreeItemLabel>
        <template #sublist>
          <VtsTreeList>
            <VtsTreeItem v-for="i of 3" :key="i">
              <UiTreeItemLabel :icon="faServer" route="dashboard">
                Host - {{ i }}
                <template #addons>
                  <VtsIcon v-if="i === 2" :icon="faStar" accent="warning" />
                  <VtsCounter accent="info" value="3" variant="secondary" size="small" />
                </template>
              </UiTreeItemLabel>
              <template #sublist>
                <VtsTreeList>
                  <VtsTreeItem v-for="j of 3" :key="j">
                    <UiTreeItemLabel no-indent route="dashboard">
                      <template #icon>
                        <UiObjectIcon size="medium" :state="j === 3 ? 'halted' : 'running'" type="vm" />
                      </template>
                      VM {{ i }}.{{ j }}
                      <template #addons>
                        <VtsIcon v-if="j === 2" busy accent="current" />
                        <VtsButtonIcon accent="info" size="medium" :icon="faEllipsis" />
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
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import VtsCounter from '@core/components/ui/counter/UiCounter.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { faCity, faEllipsis, faServer, faStar } from '@fortawesome/free-solid-svg-icons'
</script>
