<template>
  <ComponentStory :params>
    <VtsSelect v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { upperFirst } from 'lodash-es'
import { ref } from 'vue'

const colors = ['blue', 'yellow', 'red', 'green', 'orange', 'purple', 'white', 'grey', 'black']

const { id } = useFormSelect(colors, {
  option: {
    label: color => `${upperFirst(color)} color`,
    disabled: color => color === 'blue' || color === 'orange' || color === 'black',
  },
})

const { params, bindings } = useStory({
  props: {
    accent: {
      preset: 'brand' as const,
      type: "'brand' | 'warning' | 'danger'",
      required: true,
      widget: choice('brand', 'warning', 'danger'),
    },
    id: {
      preset: id,
      required: true,
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },

  slots: {
    default: {},
  },
})
</script>
