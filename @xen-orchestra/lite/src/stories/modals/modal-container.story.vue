<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      colorProp(),
      slot('header'),
      slot(),
      slot('footer'),
      setting('headerSlotContent').preset('Header').widget(text()).help('Content for default slot'),
      setting('defaultSlotContent').preset('Content').widget(text()).help('Content for default slot'),
      setting('footerSlotContent').preset('Footer').widget(text()).help('Content for default slot'),
      setting('showNested').preset(false).widget(boolean()).help('Show nested modal'),
    ]"
  >
    <ModalContainer v-bind="properties">
      <template #header>
        {{ settings.headerSlotContent }}
      </template>

      <template #default>
        {{ settings.defaultSlotContent }}
        <ModalContainer v-if="settings.showNested" color="error"> Nested modal </ModalContainer>
      </template>

      <template #footer>
        {{ settings.footerSlotContent }}
      </template>
    </ModalContainer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import ModalContainer from '@/components/ui/modals/ModalContainer.vue'
import { colorProp, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
</script>
