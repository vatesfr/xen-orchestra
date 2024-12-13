<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('items').preset(items[4]).required().widget()]">
    <VtsNetworkStatus v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsNetworkStatus from '@core/components/network/VtsNetworkStatus.vue'

const items = [
  {
    attached: false,
    carrier: true,
  },
  {
    attached: true,
    carrier: true,
  },
  {
    attached: false,
    carrier: false,
  },
  {
    currentlyAttached: true,
  },
  {
    currentlyAttached: false,
  },
]
</script>
