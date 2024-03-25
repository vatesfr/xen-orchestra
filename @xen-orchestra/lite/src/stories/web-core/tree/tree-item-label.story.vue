<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset(faServer),
      prop('route').required().preset('dashboard').widget(),
      prop('active').bool().widget(),
      prop('no-indent').bool().help('Remove indentation based on component depth in the tree').widget(),
      slot('default'),
      slot('addons').help('Add any extra information like quick actions button or counter'),
    ]"
  >
    <TreeList>
      <TreeItemLabel route="dashboard" v-bind="properties">Host</TreeItemLabel>
    </TreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, slot } from '@/libs/story/story-param'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { IK_TREE_ITEM_HAS_CHILDREN } from '@core/utils/injection-keys.util'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed, provide } from 'vue'

provide(
  IK_TREE_ITEM_HAS_CHILDREN,
  computed(() => true)
)
</script>
