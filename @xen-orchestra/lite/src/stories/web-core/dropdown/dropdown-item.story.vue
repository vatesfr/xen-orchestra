<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp('icon'),
      prop('arrow').bool().widget(),
      prop('info').str().widget(),
      colorProp().default(undefined),
      prop('disabled').bool().widget(),
      prop('selected').bool().widget(),
      slot(),
      slot('icon').help('You can use this slot to handle the icon by yourself'),
      setting('checkbox').help('Add the `checkbox` prop to `DropdownList`').widget(boolean()),
      setting('defaultSlotContent').preset('Item label').widget(text()).help('Content for default slot'),
    ]"
  >
    <DropdownList :checkbox="settings.checkbox">
      <DropdownItem v-for="n in 5" :key="n" v-bind="properties">
        {{ settings.defaultSlotContent }}
      </DropdownItem>
    </DropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { colorProp, iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import DropdownItem from '@core/components/dropdown/DropdownItem.vue'
import DropdownList from '@core/components/dropdown/DropdownList.vue'
</script>
