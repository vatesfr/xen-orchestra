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
      <VtsActionItems :actions />
    </slot>
  </MenuList>
</template>

<script setup lang="ts">
import type { MenuItemAccent } from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
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
</script>
