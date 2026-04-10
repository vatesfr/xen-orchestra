<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiButtonIcon icon="action:more-actions" accent="brand" :size @click="open($event)" />
    </template>
    <MenuItem
      v-for="(action, index) of actions"
      :key="index"
      :icon="action.icon"
      :disabled="action.disabled"
      :busy="action.busy"
      :on-click="action.onClick"
    >
      {{ action.label }}
    </MenuItem>
  </MenuList>
</template>

<script setup lang="ts">
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import type { ButtonIconSize } from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { IconName } from '@core/icons'

export type ActionItem = {
  label: string
  icon?: IconName
  onClick: () => any
  disabled?: boolean
  busy?: boolean
}

const { size = 'small', actions = [] } = defineProps<{
  size?: ButtonIconSize
  actions?: ActionItem[]
}>()
</script>
