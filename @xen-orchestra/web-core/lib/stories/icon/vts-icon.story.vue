<template>
  <ComponentStory :params :presets>
    <VtsIcon v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsIcon, { type IconAccent } from '@core/components/icon/VtsIcon.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheck, faCircle, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const { bindings, params } = useStory({
  props: {
    accent: {
      preset: ref<IconAccent>('brand'),
      type: 'IconAccent',
      required: true,
      widget: choice('current', 'brand', 'info', 'success', 'warning', 'danger', 'muted'),
    },
    icon: {
      type: 'IconDefinition',
      preset: ref<IconDefinition>(faCheck),
    },
    overlayIcon: {
      type: 'IconDefinition',
      preset: ref<IconDefinition>(),
      description: 'Meant to display a centered smaller icon on top of the main icon. See presets for examples',
    },
    busy: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    fixedWidth: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
})

const presets = {
  'Stacked Icon success circle': () => {
    bindings.accent = 'success'
    bindings.icon = faCircle
    bindings.overlayIcon = faCheck
  },
  'Stacked Icon warning exclamation': () => {
    bindings.accent = 'warning'
    bindings.icon = faCircle
    bindings.overlayIcon = faExclamation
  },
}
</script>
