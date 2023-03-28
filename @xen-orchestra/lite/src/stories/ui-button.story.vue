<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('type').enum('submit', 'button', 'reset').default('button'),
      prop('busy').bool().widget(),
      prop('disabled').bool().widget(),
      iconProp(),
      colorProp(),
      prop('outlined').bool().widget(),
      prop('transparent').bool().widget(),
      prop('active').bool().widget(),
      setting('label').preset('Click me').widget(),
    ]"
    :presets="{
      'Save Button': {
        props: {
          color: 'success',
          icon: faFloppyDisk,
        },
        settings: {
          label: 'Save',
        },
      },
      'Delete Button': {
        props: {
          icon: faTrash,
          color: 'error',
        },
        settings: {
          label: 'Delete',
        },
      },
    }"
  >
    <UiButton v-bind="properties">{{ settings.label }}</UiButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { colorProp, iconProp, prop, setting } from "@/libs/story/story-param";
import { faFloppyDisk, faTrash } from "@fortawesome/free-solid-svg-icons";
</script>

<style lang="postcss" scoped></style>
