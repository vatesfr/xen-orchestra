<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').required().enum('info', 'warning', 'danger').preset('info').widget(),
      prop('label').str().widget().preset('Label'),
      prop('info').str().widget().preset('message'),
      prop('vertical').bool().widget(),
      slot().help('Meant to receive a list of checkboxes component'),
      slot('label').help('Meant to receive a label UiLabel component or another component'),
      slot('info').help('Meant to receive a message info or UiInfo component or another component'),
    ]"
  >
    <UiCheckboxGroup v-bind="properties">
      <UiCheckbox v-for="(label, index) in labels" v-bind="properties" :key="index">
        {{ label }}
      </UiCheckbox>
    </UiCheckboxGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import { ref } from 'vue'

const labels = ref(['Label 1', 'Label 2', 'Label 3'])
</script>
