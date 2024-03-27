<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('checkbox').bool().widget(),
      slot().help('This slot is meant to receive a list of <DropdownItem> and <DropdownTitle>'),
    ]"
  >
    <DropdownList v-bind="properties">
      <DropdownItem v-for="n in 5" :key="n">Item label</DropdownItem>
    </DropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import DropdownItem from '@core/components/dropdown/DropdownItem.vue'
import DropdownList from '@core/components/dropdown/DropdownList.vue'
</script>
