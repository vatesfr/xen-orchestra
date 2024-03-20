<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[slot('default'), slot('addons').help('Add any extra information like quick actions button or counter')]"
  >
    <TreeList>
      <TreeItemLabel v-bind="properties" route="dashboard" :icon="faServer">Host</TreeItemLabel>
    </TreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import TreeItemLabel from '@core/components/tree-view/TreeItemLabel.vue'
import TreeList from '@core/components/tree-view/TreeList.vue'
import { IK_TREE_ITEM_HAS_CHILDREN } from '@core/utils/injection-keys.util'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed, provide } from 'vue'

provide(
  IK_TREE_ITEM_HAS_CHILDREN,
  computed(() => true)
)
</script>
