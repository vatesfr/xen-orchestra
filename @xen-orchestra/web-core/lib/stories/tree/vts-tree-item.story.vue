<template>
  <ComponentStory :params>
    <VtsTreeList>
      <VtsTreeItem v-bind="bindings">
        <UiTreeItemLabel :icon="faServer" route="dashboard" @toggle="bindings.expanded = !bindings.expanded">
          Host
        </UiTreeItemLabel>
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
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    expanded: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {
      help: 'Meant to receive a <UiTreeItemLabel>',
    },
    sublist: {
      help: 'Meant to receive a <VtsTreeList> child.',
    },
  },
})
</script>
