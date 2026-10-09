<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('title').str().required().preset('Unable to create cluster').widget(),
      prop('error').str().preset('An error occurred').widget(),
      prop('details')
        .type('string | object')
        .preset(details1)
        .widget(object())
        .help('When set, displayed in a log entry viewer below the error message'),
      event('close'),
      slot('content').help('Replaces the error message. The details are still displayed below it'),
      setting('contentSlotContent').widget(text()).help('Leave empty to use the error prop'),
    ]"
    :presets
  >
    <VtsErrorModal class="story" v-bind="properties">
      <template v-if="settings.contentSlotContent" #content>{{ settings.contentSlotContent }}</template>
    </VtsErrorModal>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, setting, slot } from '@/libs/story/story-param.ts'
import { object, text } from '@/libs/story/story-widget.ts'
import VtsErrorModal from '@core/components/modal/VtsErrorModal.vue'

const details1 = {
  code: 'HOST_NOT_ENOUGH_FREE_MEMORY',
  params: ['8589934592', '2147483648'],
  call: {
    method: 'VM.start',
    params: ['OpaqueRef:3f2a9c1e-7b4d-4e8a-9f6c-2d1b5a8e7c90', false, false],
  },
}

const details2 =
  'TypeError: Failed to fetch\n    at fetchApi (rest-api.ts:42:11)\n    at async createCluster (cluster-create.job.ts:88:5)'

const presets = {
  'Without details': {
    props: { details: undefined },
  },
  'With details object': {
    props: { details: details1 },
  },
  'With details string': {
    props: { details: details2 },
  },
}
</script>

<style lang="postcss" scoped>
.story {
  position: relative;
  height: 100%;
}
</style>
