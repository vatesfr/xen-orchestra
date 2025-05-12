<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().type('string | number').preset(''),
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('id').str().widget(),
      prop('required').bool().widget(),
      prop('type').enum('text', 'number', 'password', 'search').preset('text').widget(),
      iconProp(),
      prop('rightIcon').widget(
        choice({ label: 'Search', value: faMagnifyingGlass }, { label: 'AngleDown', value: faAngleDown })
      ),
      prop('clearable').bool().widget(),
      prop('disabled').bool().widget().help('Not defined as component prop'),
      slot('rightIcon').help('Can be used in place of rightIcon prop'),
    ]"
  >
    <UiInput placeholder="Enter your search" v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, model, prop, slot } from '@/libs/story/story-param'
import { choice } from '@/libs/story/story-widget.ts'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { faAngleDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
</script>
