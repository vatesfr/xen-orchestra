<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('status')
        .enum('connected', 'disconnected', 'partially-connected', 'disconnected-from-physical-device')
        .required()
        .preset('connected')
        .widget(),
    ]"
  >
    <VtsConnectionStatus v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
</script>
