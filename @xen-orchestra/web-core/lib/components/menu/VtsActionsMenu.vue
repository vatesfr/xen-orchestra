<template>
  <VtsResponsiveMenu :title="resolvedLabel" :section-title="t('actions')" :placement @action="handleMenuAction?.()">
    <template #trigger="{ open, isOpen }">
      <UiButtonIcon
        v-tooltip="{
          placement: 'top',
          content: resolvedLabel,
        }"
        :aria-label="resolvedLabel"
        icon="action:more-actions"
        accent="brand"
        :size
        :selected="isOpen"
        @click="open($event)"
      />
    </template>
    <slot>
      <VtsActionItems :actions />
    </slot>
  </VtsResponsiveMenu>
</template>

<script setup lang="ts">
import type { MenuItemAccent } from '@core/components/menu/MenuItem.vue'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import type { ButtonIconSize } from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { IK_MENU_ACTION_HANDLER } from '@core/utils/injection-keys.util.ts'
import type { Options } from 'placement.js'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  size = 'small',
  actions = [],
  placement = 'bottom-end',
  label,
} = defineProps<{
  size?: ButtonIconSize
  actions?: ActionItem[]
  placement?: Options['placement']
  label?: string
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const resolvedLabel = computed(() => label ?? t('quick-actions'))

const handleMenuAction = inject(IK_MENU_ACTION_HANDLER, undefined)

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
