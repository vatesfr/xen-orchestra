<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[slot().help('This slot is meant to receive a list of <DropdownItem> and <DropdownTitle>')]"
  >
    <UiDropdownList v-bind="properties">
      <UiDropdown v-for="n in 5" :key="n" accent="brand">Item label</UiDropdown>
    </UiDropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
</script>
