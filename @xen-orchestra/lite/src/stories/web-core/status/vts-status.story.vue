<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('status')
        .required()
        .enum(...statuses)
        .type('Status')
        .preset(true)
        .widget(),
    ]"
  >
    <VtsStatus v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsStatus from '@core/components/status/VtsStatus.vue'

const statuses = [
  { label: 'connected', value: 'connected' },
  { label: 'disconnected', value: 'disconnected' },
  { label: 'partially-connected', value: 'partially-connected' },
  { label: 'disconnected-from-physical-device', value: 'disconnected-from-physical-device' },
  { label: 'physically-disconnected', value: 'physically-disconnected' },
  { label: 'success', value: 'success' },
  { label: 'skipped', value: 'skipped' },
  { label: 'interrupted', value: 'interrupted' },
  { label: 'failure', value: 'failure' },
  { label: 'pending', value: 'pending' },
  { label: 'enabled', value: 'enabled' },
  { label: 'disabled', value: 'disabled' },
  { label: 'true (boolean)', value: true },
  { label: 'false (boolean)', value: false },
]
</script>
