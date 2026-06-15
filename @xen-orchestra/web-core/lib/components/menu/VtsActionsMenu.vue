<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{
          placement: 'top',
          content: t('quick-actions'),
        }"
        icon="action:more-actions"
        accent="brand"
        :size
        @click="open($event)"
      />
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
      <i v-if="action.hint">{{ action.hint }}</i>
      <template v-if="action.children?.length" #submenu>
        <MenuItem
          v-for="(child, childIndex) of action.children"
          :key="childIndex"
          :icon="child.icon"
          :disabled="child.disabled"
          :busy="child.busy"
          :on-click="child.onClick"
        >
          {{ child.label }}
        </MenuItem>
      </template>
    </MenuItem>
  </MenuList>
</template>

<script setup lang="ts">
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import type { ButtonIconSize } from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { useI18n } from 'vue-i18n'

const { size = 'small', actions = [] } = defineProps<{
  size?: ButtonIconSize
  actions?: ActionItem[]
}>()

const { t } = useI18n()

export type ActionItem = {
  label: string
  hint?: string
  icon?: IconName
  onClick?: () => any
  disabled?: boolean
  busy?: boolean
  children?: ActionItem[]
}
</script>
