<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('text').required().preset('xen-orchestra').widget()]">
    <UiLogoText :text="properties.text" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiLogoText from '@core/components/ui/logo-text/UiLogoText.vue'
</script>
