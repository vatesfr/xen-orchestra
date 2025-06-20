<template>
  <ComponentStory :params="[slot()]">
    <VtsTreeList>
      <VtsTreeItem>
        <UiTreeItemLabel icon="fa:city" route="dashboard">Pool</UiTreeItemLabel>
        <template #sublist>
          <VtsTreeList>
            <VtsTreeItem v-for="i of 3" :key="i">
              <UiTreeItemLabel icon="fa:cerver" route="dashboard">
                Host - {{ i }}
                <template #addons>
                  <VtsIcon v-if="i === 2" name="legacy:primary" size="medium" />
                  <UiCounter accent="brand" value="3" variant="secondary" size="small" />
                </template>
              </UiTreeItemLabel>
              <template #sublist>
                <VtsTreeList>
                  <VtsTreeItem v-for="j of 3" :key="j">
                    <UiTreeItemLabel no-indent route="dashboard">
                      <template #icon>
                        <VtsObjectIcon size="medium" :state="j === 3 ? 'halted' : 'running'" type="vm" />
                      </template>
                      VM {{ i }}.{{ j }}
                      <template #addons>
                        <VtsIcon v-if="j === 2" busy :name="undefined" size="medium" />
                        <UiButtonIcon accent="brand" size="medium" icon="fa:ellipsis" />
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
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
</script>
