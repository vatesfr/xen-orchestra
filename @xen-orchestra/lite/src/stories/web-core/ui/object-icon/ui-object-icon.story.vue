<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('type')
        .type('SupportedType')
        .enum('vm', 'host', 'sr', 'backup-repository', 'network')
        .required()
        .preset('vm')
        .widget(),
      prop('size').type('ObjectIconSize').enum('small', 'medium', 'large').required().preset('medium').widget(),
      prop('state')
        .type(`SupportedStates<TType> | 'disabled'`)
        .enum(
          'running',
          'halted',
          'paused',
          'suspended',
          'connected',
          'disconnected',
          'partially-connected',
          'maintenance',
          'disabled'
        )
        .default('disabled')
        .preset('running')
        .widget(),
    ]"
  >
    <UiObjectIcon v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
</script>
