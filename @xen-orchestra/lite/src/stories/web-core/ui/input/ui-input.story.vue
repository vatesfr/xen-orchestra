<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().type('string | number').preset(''),
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('id').str().widget(),
      prop('required').bool().widget(),
      prop('selected').bool().widget(),
      prop('readonly').bool().widget(),
      prop('type').enum('text', 'number', 'password', 'search').preset('text').widget(),
      prop('rightIcon').widget(
        choice({ label: 'Search', value: 'fa:magnifying-glass' }, { label: 'AngleDown', value: 'fa:angle-down' })
      ),
      prop('clearable').bool().widget(),
      prop('prefix').str().widget(),
      prop('suffix').str().widget(),
      prop('disabled').bool().widget(),
      slot('right-icon').help('Can be used in place of rightIcon prop'),
      slot('prefix').help('Can be used in place of prefix prop'),
      slot('suffix').help('Can be used in place of suffix prop'),
    ]"
  >
    <UiInput placeholder="Enter your search" v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { model, prop, slot } from '@/libs/story/story-param'
import { choice } from '@/libs/story/story-widget.ts'
import UiInput from '@core/components/ui/input/UiInput.vue'
</script>
