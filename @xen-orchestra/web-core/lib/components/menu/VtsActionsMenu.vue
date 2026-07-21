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
    <slot>
      <MenuItem
        v-for="(action, index) of actions"
        :key="index"
        :icon="action.icon"
        :disabled="action.disabled"
        :busy="action.busy"
        :on-click="action.onClick"
        class="typo-body-bold-small"
      >
        {{ action.label }}
        <i v-if="action.hint">{{ action.hint }}</i>
        <template v-if="isGroupAction(action)" #submenu>
          <MenuItem
            v-for="(child, childIndex) of action.children"
            :key="childIndex"
            :icon="child.icon"
            :disabled="child.disabled"
            :busy="child.busy"
            :on-click="child.onClick"
            class="typo-body-bold-small"
          >
            {{ child.label }}
            <i v-if="child.hint">{{ child.hint }}</i>
          </MenuItem>
        </template>
      </MenuItem>
    </slot>
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

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

type BaseActionItem = {
  label: string
  hint?: string
  icon?: IconName
  disabled?: boolean
  busy?: boolean
}

export type LeafActionItem = BaseActionItem & {
  onClick: () => unknown
  children?: never
}

export type GroupActionItem = BaseActionItem & {
  onClick?: never
  children: LeafActionItem[]
}

export type ActionItem = LeafActionItem | GroupActionItem

function isGroupAction(action: ActionItem): action is GroupActionItem {
  return 'children' in action
}
</script>
