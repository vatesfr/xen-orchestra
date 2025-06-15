<template>
  <ComponentStory :params>
    <UiDropdownList v-bind="bindings">
      <UiDropdown v-for="n in 5" :key="n" accent="brand">Item label</UiDropdown>
    </UiDropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  slots: {
    default: { help: 'This slot is meant to receive a list of <DropdownItem> and <DropdownTitle>' },
  },
})
</script>
