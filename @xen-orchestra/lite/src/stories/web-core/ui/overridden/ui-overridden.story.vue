<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot().help('Label displayed next to the dot, leave empty to only display the dot'),
      setting('defaultSlot').widget(text()).preset('Overridden'),
    ]"
  >
    <UiOverridden v-if="settings.defaultSlot">{{ settings.defaultSlot }}</UiOverridden>
    <UiOverridden v-else />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
</script>
