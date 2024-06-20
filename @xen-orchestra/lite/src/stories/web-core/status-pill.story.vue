<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('state')
        .type(`'success' | 'partial' | 'failure'`)
        .required()
        .enum('success', 'partial', 'failure')
        .preset('success')
        .widget(),
    ]"
  >
    <StatusPill v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import StatusPill from '@core/components/StatusPill.vue'
</script>
