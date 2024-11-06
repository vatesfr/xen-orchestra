<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp().preset(faShip),
      slot('title'),
      slot('subtitle'),
      slot('default'),
      slot('buttons').help('Meant to receive UiButton components'),
      setting('title').preset('Do you confirm?').widget(),
      setting('subtitle').preset('You should be sure about this').widget(),
    ]"
  >
    <ConfirmModalLayout v-bind="properties">
      <template #title>{{ settings.title }}</template>
      <template #subtitle>{{ settings.subtitle }}</template>
      <template #buttons>
        <UiButton variant="secondary" accent="info" size="medium">I prefer not</UiButton>
        <UiButton variant="primary" accent="info" size="medium">Yes, I'm sure!</UiButton>
      </template>
    </ConfirmModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import { iconProp, setting, slot } from '@/libs/story/story-param'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { faShip } from '@fortawesome/free-solid-svg-icons'
</script>
