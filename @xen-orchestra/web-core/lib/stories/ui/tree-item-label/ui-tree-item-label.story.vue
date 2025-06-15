<template>
  <ComponentStory :params>
    <VtsTreeList>
      <UiTreeItemLabel v-bind="bindings">Pool</UiTreeItemLabel>
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { IK_TREE_ITEM_HAS_CHILDREN } from '@core/utils/injection-keys.util.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed, provide, ref } from 'vue'

provide(
  IK_TREE_ITEM_HAS_CHILDREN,
  computed(() => true)
)

const { params, bindings } = useStory({
  props: {
    route: {
      type: 'RouteLocationRaw',
      required: true,
      preset: {
        name: 'pool.dashboard',
        params: { uuid: '355ee47d-ff4c-4924-3db2-fd86ae629676' },
      },
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    active: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    noIndent: {
      preset: ref<boolean>(),
      type: 'boolean',
      help: 'Remove indentation based on component depth in the tree',
      widget: false,
    },
  },
  events: {
    toggle: {
      help: 'Emitted when the item is toggled (expanded/collapsed)',
    },
  },
  slots: {
    default: {
      help: 'Default slot content',
    },
    icon: {
      help: 'Meant to receive a VtsIcon or another icon component in case the icon prop is not used',
    },
    addons: {
      help: 'Add any extra information like quick actions button or counter',
    },
  },
})
</script>
