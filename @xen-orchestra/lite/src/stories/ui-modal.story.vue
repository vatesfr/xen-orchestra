<template>
  <ComponentStory
    :params="[
      colorProp(),
      iconProp(),
      event('close').preset(close),
      slot('default'),
      slot('title'),
      slot('subtitle'),
      slot('icon'),
      slot('buttons').help('Meant to receive UiButton components'),
      setting('title').preset('Modal Title').widget(),
      setting('subtitle').preset('Modal Subtitle').widget(),
    ]"
    v-slot="{ properties, settings }"
  >
    <UiButton type="button" @click="open">Open Modal</UiButton>

    <UiModal v-bind="properties" v-if="isOpen">
      <template #title>{{ settings.title }}</template>
      <template #subtitle>{{ settings.subtitle }}</template>
      <template #buttons>
        <UiButton @click="close">Discard</UiButton>
      </template>
    </UiModal>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";
import {
  colorProp,
  event,
  iconProp,
  setting,
  slot,
} from "@/libs/story/story-param";

const { open, close, isOpen } = useModal();
</script>

<style lang="postcss" scoped></style>
