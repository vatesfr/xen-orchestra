<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .required()
        .type('DropdownAccent')
        .enum('normal', 'brand', 'success', 'warning', 'danger')
        .required()
        .preset('brand')
        .widget(),
      prop('disabled').bool().widget(),
      prop('locked').bool().widget(),
      prop('selected').bool().widget(),
      prop('hover').bool().widget(),
      prop('subMenuIcon').bool().widget(),
      iconProp('icon'),
      prop('info').str().widget(),
      slot('icon').help('You can use this slot to handle the icon by yourself'),
      slot(),
      setting('checkbox').help('Pass `checkbox` prop to `DropdownList`').widget(boolean()),
      setting('defaultSlotContent').preset('Item label').widget(text()).help('Content for default slot'),
    ]"
  >
    <UiDropdownList :checkbox="settings.checkbox">
      <UiDropdown v-for="n in 5" :key="n" v-bind="properties">
        {{ settings.defaultSlotContent }}
      </UiDropdown>
    </UiDropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
</script>
