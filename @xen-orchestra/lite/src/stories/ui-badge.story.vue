<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[iconProp(), setting('label').preset('65%').widget(), slot()]"
  >
    <UiBadge v-bind="properties">{{ settings.label }}</UiBadge>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { iconProp, setting, slot } from '@/libs/story/story-param'
</script>
