<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset('fa:ellipsis'),
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('size').required().enum('small', 'medium', 'large').preset('medium').widget(),
      prop('disabled').bool().widget(),
      prop('selected').bool().widget(),
      prop('dot').bool().widget(),
      prop('targetScale')
        .type('number | { x: number; y: number }')
        .default(1)
        .preset({ x: 2, y: 2 })
        .help('Meant to increase click target size if needed')
        .widget(),
    ]"
  >
    <UiButtonIcon v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
</script>
