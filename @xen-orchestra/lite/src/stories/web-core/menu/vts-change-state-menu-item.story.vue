<template>
  <ComponentStory :params="[slot().help('Power state actions, shown in the submenu')]">
    <MenuList placement="bottom-start">
      <template #trigger="{ open }">
        <UiButtonIcon accent="brand" icon="action:more-actions" size="medium" @click="open($event)" />
      </template>
      <VtsChangeStateMenuItem>
        <MenuItem accent="neutral" icon="fa:play" :on-click>Start</MenuItem>
        <MenuItem accent="neutral" icon="fa:stop" :on-click>Shutdown</MenuItem>
      </VtsChangeStateMenuItem>
    </MenuList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'

function onClick() {
  return new Promise(resolve => setTimeout(resolve, 500))
}
</script>
