<template>
  <ComponentStory :params="[slot().help('This slot is meant to receive a list of <DropdownItem> and <DropdownTitle>')]">
    <DropdownList>
      <DropdownItem v-for="n in 5" :key="n">Item label</DropdownItem>
    </DropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import DropdownItem from '@core/components/dropdown/DropdownItem.vue'
import DropdownList from '@core/components/dropdown/DropdownList.vue'
</script>
