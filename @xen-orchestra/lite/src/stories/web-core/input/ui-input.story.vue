<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().type('string'),
      prop('id').str().required().preset('input-id').widget(),
      prop('disabled').bool().widget(),
      iconProp('left-icon').preset(faMagnifyingGlass).type('IconDefinition'),
    ]"
  >
    <UiInput placeholder="Enter your search" v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, model, prop } from '@/libs/story/story-param'
import UiInput from '@core/components/input/UiInput.vue'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
</script>
