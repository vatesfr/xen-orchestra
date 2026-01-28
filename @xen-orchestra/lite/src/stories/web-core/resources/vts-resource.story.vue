<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset('object:vm'),
      prop('label').required().str().widget().preset('Displays'),
      prop('count').required().type('string | number').widget(text()).preset('175'),
    ]"
  >
    <VtsResource v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsResource from '@core/components/resources/VtsResource.vue'
</script>
