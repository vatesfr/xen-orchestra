<!-- v1 -->
<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[slot().help('Meant to display the title'), setting('default').preset('Label').widget()]"
  >
    <UiSubtitle v-bind="properties">
      {{ settings.default }}
    </UiSubtitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
</script>
