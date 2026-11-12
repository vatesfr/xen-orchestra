<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('variant')
        .type('ButtonVariant')
        .enum('primary', 'secondary', 'tertiary')
        .preset('tertiary')
        .required()
        .widget(),
      prop('accent').type('ButtonAccent').enum('brand', 'warning', 'danger').preset('brand').required().widget(),
      iconProp().preset('action:connect'),
      prop('disabled').bool().widget(),
      prop('busy').bool().widget(),
      prop('hint').str().preset('Already connected').widget().help('Shown when disabled'),
      event('click'),
      slot(),
      setting('label').preset('Connect').widget(text()),
      setting('inMenu').preset(false).widget(boolean()).help('Render the button inside a menu'),
    ]"
  >
    <MenuList v-if="settings.inMenu" placement="bottom-start">
      <template #trigger="{ open }">
        <UiButtonIcon accent="brand" icon="action:more-actions" size="medium" @click="open($event)" />
      </template>
      <VtsActionButton v-bind="properties">{{ settings.label }}</VtsActionButton>
    </MenuList>
    <VtsActionButton v-else v-bind="properties">{{ settings.label }}</VtsActionButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, iconProp, prop, setting, slot } from '@/libs/story/story-param.ts'
import { boolean, text } from '@/libs/story/story-widget.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
</script>
