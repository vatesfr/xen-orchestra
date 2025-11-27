<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('size').enum('small', 'medium').preset('medium').required().widget(), slot()]"
  >
    <UiBreadcrumb v-bind="properties">
      <UiLink :size="properties.size" to="#">Site</UiLink>
      <UiLink :size="properties.size" to="#">Backups jobs</UiLink>
      <UiLink :size="properties.size" to="#">Backups logs</UiLink>
      Current page
    </UiBreadcrumb>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
</script>
