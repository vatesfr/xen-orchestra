<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().type('string[]').preset(['alpha', 'beta']).help('Enter or comma adds the typed value'),
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('placeholder').str().preset('Add a value').widget(),
    ]"
  >
    <VtsInputWrapper label="Values">
      <VtsTagsInput v-bind="properties" />
    </VtsInputWrapper>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { model, prop } from '@/libs/story/story-param.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsTagsInput from '@core/components/tags-input/VtsTagsInput.vue'
</script>
