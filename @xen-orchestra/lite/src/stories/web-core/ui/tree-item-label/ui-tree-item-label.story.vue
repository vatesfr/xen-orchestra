<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset(faCity),
      prop('route')
        .required()
        .type('RouteLocationRaw')
        .preset({ name: 'pool.dashboard', params: { uuid: '355ee47d-ff4c-4924-3db2-fd86ae629676' } })
        .widget(),
      prop('active').bool().widget(),
      prop('no-indent').bool().help('Remove indentation based on component depth in the tree'),
      slot('default'),
      slot('icon').help('Meant to receive a VtsIcon or another icon component in case the icon prop is not used'),
      slot('addons').help('Add any extra information like quick actions button or counter'),
    ]"
  >
    <VtsTreeList>
      <UiTreeItemLabel route="dashboard" v-bind="properties">Pool</UiTreeItemLabel>
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, slot } from '@/libs/story/story-param'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { IK_TREE_ITEM_HAS_CHILDREN } from '@core/utils/injection-keys.util'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed, provide } from 'vue'

provide(
  IK_TREE_ITEM_HAS_CHILDREN,
  computed(() => true)
)
</script>
