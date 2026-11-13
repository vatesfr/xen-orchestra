<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('placement').str().preset('bottom-end').widget().help('Placement of the dropdown'),
      slot().help('Power state actions'),
    ]"
  >
    <VtsChangeStateMenu v-bind="properties">
      <MenuItem accent="neutral" icon="fa:play" :on-click>Start</MenuItem>
      <MenuItem accent="neutral" icon="fa:stop" :on-click>Shutdown</MenuItem>
    </VtsChangeStateMenu>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsChangeStateMenu from '@core/components/menu/VtsChangeStateMenu.vue'

function onClick() {
  return new Promise(resolve => setTimeout(resolve, 500))
}
</script>
