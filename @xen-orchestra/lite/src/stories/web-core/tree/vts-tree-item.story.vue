<template>
  <ComponentStory
    :params="[
      slot().help('Meant to receive a <UiTreeItemLabel>'),
      slot('sublist').help('Meant to receive a <VtsTreeList> child.'),
    ]"
  >
    <VtsTreeList>
      <VtsTreeItem>
        <UiTreeItemLabel :icon="faServer" route="dashboard">Host</UiTreeItemLabel>
        <template #sublist>
          <VtsTreeList>
            <VtsTreeItem>
              <UiTreeItemLabel no-indent route="dashboard">Sublist goes here</UiTreeItemLabel>
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
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
</script>
