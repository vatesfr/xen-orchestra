<template>
  <ComponentStory :params :presets>
    <UiObjectIcon v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiObjectIcon, { type ObjectIconSize } from '@core/components/ui/object-icon/UiObjectIcon.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import type { SupportedState, SupportedType } from '@core/types/object-icon.type.ts'

const { params, bindings } = useStory({
  props: {
    type: {
      type: 'SupportedType',
      preset: 'vm' as SupportedType,
      required: true,
    },
    size: {
      type: 'ObjectIconSize',
      preset: 'large' as ObjectIconSize,
      required: true,
    },
    state: {
      type: 'SupportedState<Type>',
      preset: 'disabled' as SupportedState<any>,
    },
  },
})

const presets = {
  'Running VM': () => {
    bindings.type = 'vm'
    bindings.state = 'running'
  },
}
</script>
