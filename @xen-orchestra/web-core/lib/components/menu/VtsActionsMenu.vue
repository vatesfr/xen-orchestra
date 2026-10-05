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
      <template v-for="(action, index) of actions" :key="index">
        <MenuSeparator v-if="action.separator" />
        <MenuItem
          :icon="action.icon"
          :disabled="action.disabled"
          :busy="action.busy"
          :accent="action.accent ?? 'neutral'"
          :on-click="action.onClick"
        >
          {{ action.label }}
          <i v-if="action.hint" class="em-dash-prefix">{{ action.hint }}</i>
          <template v-if="isGroupAction(action)" #submenu>
            <template v-for="(child, childIndex) of action.children" :key="childIndex">
              <MenuSeparator v-if="child.separator" />
              <MenuItem
                :icon="child.icon"
                :disabled="child.disabled"
                :busy="child.busy"
                :accent="child.accent ?? 'neutral'"
                :on-click="child.onClick"
              >
                {{ child.label }}
                <i v-if="child.hint" class="em-dash-prefix">{{ child.hint }}</i>
              </MenuItem>
            </template>
          </template>
        </MenuItem>
      </template>
    </slot>
  </MenuList>
</template>

<script setup lang="ts">
import type { MenuItemAccent } from '@core/components/menu/MenuItem.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
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
  accent?: MenuItemAccent
  separator?: boolean
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
