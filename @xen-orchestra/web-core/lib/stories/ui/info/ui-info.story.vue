<template>
  <ComponentStory :params>
    <div class="wrapper">
      <UiInfo v-bind="bindings">{{ settings.defaultSlot }}</UiInfo>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'info' as InfoAccent,
      type: 'InfoAccent',
      widget: choice('info', 'success', 'warning', 'danger', 'muted'),
      required: true,
    },
    wrap: {
      preset: ref<boolean>(),
      type: 'boolean',
      description: 'Choose if the text should wrap if too long',
    },
  },
  slots: {
    default: {},
  },
  settings: {
    defaultSlot: {
      preset: 'message',
    },
  },
})
</script>

<style scoped lang="postcss">
.wrapper {
  max-width: 30rem;
}
</style>
