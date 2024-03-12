<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('busy').type('boolean').widget(),
      prop('disabled').type('boolean').widget().ctx(),
      colorProp().ctx(),
      prop('outlined').type('boolean').widget(),
      prop('transparent').type('boolean').widget(),
      prop('underlined').type('boolean').widget(),
      prop('merge').type('boolean').widget(),
      slot().help('Meant to receive UiButton components'),
    ]"
  >
    <ButtonGroup v-bind="properties">
      <UiButton>Button 1</UiButton>
      <UiButton>Button 2</UiButton>
      <UiButton>Button 3</UiButton>
    </ButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { colorProp, prop, slot } from '@/libs/story/story-param'
import ButtonGroup from '@core/components/button/ButtonGroup.vue'
import UiButton from '@core/components/button/UiButton.vue'
</script>

<style lang="postcss" scoped></style>
