<template>
  <ComponentStory
    v-slot="{ properties, settings }"
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
      setting('nested_modal').widget(boolean()),
    ]"
  >
    <UiButton type="button" @click="open">Open Modal</UiButton>

    <UiModal v-if="isOpen" v-bind="properties">
      <template #title>{{ settings.title }}</template>
      <template #subtitle>{{ settings.subtitle }}</template>
      <template #buttons>
        <UiButton @click="close">Discard</UiButton>
      </template>
      <template v-if="settings.nested_modal">
        <UiModal :icon="faWarning" color="warning">
          <template #title>Warning</template>
          <template #subtitle> This is a warning "nested" modal.</template>
          <UiModal :icon="faInfoCircle" color="info">
            <template #title>Info</template>
            <template #subtitle> This is an info "nested" modal.</template>
          </UiModal>
        </UiModal>
        <UiModal :icon="faCheck" color="success">
          <template #title>Success</template>
          <template #subtitle> This is a success "deep nested" modal.</template>
        </UiModal>
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
import {
  faCheck,
  faInfoCircle,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { boolean } from "@/libs/story/story-widget";

const { open, close, isOpen } = useModal();
</script>

<style lang="postcss" scoped></style>
