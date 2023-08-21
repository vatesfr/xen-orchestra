<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      slot('title'),
      slot('subtitle'),
      slot('default'),
      slot('buttons').help('Meant to receive UiButton components'),
      setting('title').preset('Modal Title').widget(),
      setting('subtitle').preset('Modal Subtitle').widget(),
    ]"
  >
    <ConfirmModalLayout v-bind="properties">
      <template #title>{{ settings.title }}</template>
      <template #subtitle>{{ settings.subtitle }}</template>
      <template #buttons>
        <UiButton outlined>Discard</UiButton>
        <UiButton>Go</UiButton>
      </template>
    </ConfirmModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import ConfirmModalLayout from "@/components/ui/modals/layouts/ConfirmModalLayout.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { iconProp, setting, slot } from "@/libs/story/story-param";
</script>

<style lang="postcss" scoped></style>
