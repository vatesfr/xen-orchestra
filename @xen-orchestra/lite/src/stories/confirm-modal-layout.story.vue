<template>
  <ComponentStory
    :params="[
      colorProp(),
      iconProp().required().preset(faShip),
      slot('default'),
      slot('title'),
      slot('subtitle'),
      slot('buttons').help('Meant to receive UiButton components'),
      setting('title').preset('Modal Title').widget(),
      setting('subtitle').preset('Modal Subtitle').widget(),
      setting('nested_modal').widget(boolean()),
    ]"
    v-slot="{ properties, settings }"
  >
    <ConfirmModalLayout v-bind="properties" v-if="!settings.nested_modal">
      <template #title>{{ settings.title }}</template>
      <template #subtitle>{{ settings.subtitle }}</template>
      <template #buttons>
        <UiButton outlined>Discard</UiButton>
        <UiButton>Go</UiButton>
      </template>
    </ConfirmModalLayout>

    <ConfirmModalLayout v-bind="properties" v-else>
      <template #title>{{ settings.title }}</template>
      <template #subtitle>{{ settings.subtitle }}</template>
      <template #buttons>
        <UiButton outlined>Discard</UiButton>
        <UiButton>Go</UiButton>
      </template>
      <BasicModalContent color="error">
        Here is some nested ModalContainer
      </BasicModalContent>
    </ConfirmModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import BasicModalContent from "@/components/ui/modals/ModalContainer.vue";
import ConfirmModalLayout from "@/components/ui/modals/layouts/ConfirmModalLayout.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { colorProp, iconProp, setting, slot } from "@/libs/story/story-param";
import { boolean } from "@/libs/story/story-widget";
import { faShip } from "@fortawesome/free-solid-svg-icons";
</script>

<style lang="postcss" scoped></style>
