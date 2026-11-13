<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('title').str().required().preset('New').widget().help('Title of the full page menu on mobile'),
      prop('sectionTitle').str().widget().help('Section title of the full page menu on mobile'),
      prop('placement').str().preset('bottom-start').widget().help('Placement of the dropdown on desktop'),
      prop('disabled').bool().widget(),
      event('action').help('Emitted on mobile when a menu item closes the menu after its action'),
      slot('trigger').prop('open', '(event: MouseEvent) => void').prop('isOpen', 'boolean'),
      slot().help('Menu items'),
    ]"
  >
    <VtsResponsiveMenu v-bind="properties">
      <template #trigger="{ open, isOpen }">
        <UiDropdownButton variant="primary" size="medium" :selected="isOpen" @click="open($event)">
          New
        </UiDropdownButton>
      </template>
      <MenuItem accent="neutral" icon="fa:plus" :on-click>Create network</MenuItem>
      <MenuItem accent="neutral" icon="fa:plus" :on-click>Create bonded network</MenuItem>
    </VtsResponsiveMenu>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, slot } from '@/libs/story/story-param.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'

function onClick() {
  return new Promise(resolve => setTimeout(resolve, 500))
}
</script>
