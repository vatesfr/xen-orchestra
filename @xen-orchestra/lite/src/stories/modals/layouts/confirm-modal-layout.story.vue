<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp().preset(faShip),
      slot('title'),
      slot('subtitle'),
      slot('default'),
      slot('buttons').help('Meant to receive VtsButton components'),
      setting('title').preset('Do you confirm?').widget(),
      setting('subtitle').preset('You should be sure about this').widget(),
    ]"
  >
    <ConfirmModalLayout v-bind="properties">
      <template #title>{{ settings.title }}</template>
      <template #subtitle>{{ settings.subtitle }}</template>
      <template #buttons>
        <VtsButton level="secondary" color="normal" size="medium">I prefer not</VtsButton>
        <VtsButton level="primary" color="normal" size="medium">Yes, I'm sure!</VtsButton>
      </template>
    </ConfirmModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import { iconProp, setting, slot } from '@/libs/story/story-param'
import VtsButton from '@core/components/button/VtsButton.vue'
import { faShip } from '@fortawesome/free-solid-svg-icons'
</script>
