<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('size').required().enum('small', 'large').preset('large').widget(),
      prop('to').str().preset('#').widget(),
      prop('href').str().widget(),
      prop('target').enum('_blank', '_self').widget(),
      iconProp(),
      prop('selected').bool().widget(),
      prop('disabled').bool().widget(),
      prop('info').str().widget(),
      prop('counter').num().widget(),
      prop('submenu').bool().widget(),
      slot(),
      setting('label').widget(text()).preset('Label'),
    ]"
  >
    <UiMenuItem v-bind="properties">{{ settings.label }}</UiMenuItem>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiMenuItem from '@core/components/ui/menu-item/UiMenuItem.vue'
</script>
