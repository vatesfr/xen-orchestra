<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('title').str().required().preset('More actions').widget(),
      prop('sectionTitle').str().preset('Actions').widget(),
      event('action').help('Emitted when a menu item closes the menu after its action'),
      slot('trigger').prop('open', '() => void').prop('isOpen', 'boolean'),
      slot().help('Menu items, a submenu opens in place'),
    ]"
  >
    <VtsMobileMenu v-bind="properties">
      <template #trigger="{ open }">
        <UiButtonIcon accent="brand" icon="action:more-actions" size="medium" @click="open()" />
      </template>
      <MenuItem accent="brand" icon="action:change-state">
        Change state
        <template #submenu>
          <MenuItem accent="neutral" icon="fa:play" :on-click>Start</MenuItem>
          <MenuItem accent="neutral" icon="fa:stop" :on-click>Shutdown</MenuItem>
        </template>
      </MenuItem>
      <MenuItem accent="neutral" icon="action:copy" :on-click>Copy</MenuItem>
      <MenuItem accent="danger" icon="action:delete" :on-click>Delete</MenuItem>
    </VtsMobileMenu>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, slot } from '@/libs/story/story-param.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsMobileMenu from '@core/components/menu/VtsMobileMenu.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'

function onClick() {
  return new Promise(resolve => setTimeout(resolve, 500))
}
</script>
