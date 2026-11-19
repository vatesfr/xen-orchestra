<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('errors')
        .type('FormErrorSummaryItem[]')
        .required()
        .widget(object())
        .preset([
          { id: 'story-host', message: 'IP address is required.' },
          { id: 'story-username', message: 'Username is required.' },
        ])
        .help('Each error brings the element with its ID into focus'),
    ]"
  >
    <VtsFormErrorSummary v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import { object } from '@/libs/story/story-widget.ts'
import VtsFormErrorSummary from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
</script>
