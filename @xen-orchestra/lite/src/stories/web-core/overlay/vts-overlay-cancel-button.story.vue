<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot().help('Button label. Defaults to the translated \'Cancel\' label'),
      setting('label').preset('').widget(text()).help('Leave empty to use the default label'),
    ]"
  >
    <VtsOverlayCancelButton>
      <template v-if="settings.label" #default>{{ settings.label }}</template>
    </VtsOverlayCancelButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
</script>
