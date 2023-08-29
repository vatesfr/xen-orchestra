<template>
  <ComponentStory
    :params="[
      prop('busy').type('boolean').widget(),
      prop('disabled').type('boolean').widget(),
      colorProp(),
      prop('outlined').type('boolean').widget(),
      prop('transparent').type('boolean').widget(),
      prop('merge').type('boolean').widget(),
      slot().help('Meant to receive UiButton components'),
    ]"
    v-slot="{ properties }"
  >
    <UiButtonGroup v-bind="properties">
      <UiButton>Button 1</UiButton>
      <UiButton>Button 2</UiButton>
      <UiButton>Button 3</UiButton>
    </UiButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import { colorProp, prop, slot } from "@/libs/story/story-param";
</script>

<style lang="postcss" scoped></style>
