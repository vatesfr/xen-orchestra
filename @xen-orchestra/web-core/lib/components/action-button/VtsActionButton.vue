<template>
  <MenuItem v-if="isInMenu" v-show="isVisible" ref="root" :accent="menuItemAccent" :icon :disabled :busy :on-click>
    <slot />
    <i v-if="disabled && hint" class="em-dash-prefix">{{ hint }}</i>
  </MenuItem>
  <UiButton
    v-else
    v-show="isVisible"
    ref="root"
    v-tooltip="disabled && hint ? hint : false"
    size="medium"
    :variant
    :accent
    :left-icon="icon"
    :disabled
    :busy
    @click="onClick?.()"
  >
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import type { MenuItemAccent } from '@core/components/menu/MenuItem.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiButton, { type ButtonAccent, type ButtonVariant } from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { IK_MENU_TELEPORTED, IK_PANEL_ACTIONS } from '@core/utils/injection-keys.util.ts'
import { computed, inject, useTemplateRef } from 'vue'

const { accent, onClick } = defineProps<{
  variant: ButtonVariant
  accent: ButtonAccent
  icon?: IconName
  disabled?: boolean
  busy?: boolean
  hint?: string
  onClick?: () => unknown
}>()

defineSlots<{
  default(): any
}>()

const isInMenu = inject(IK_MENU_TELEPORTED, false)

const root = useTemplateRef('root')

const isVisible = inject(IK_PANEL_ACTIONS, undefined)?.register(root) ?? true

const menuItemAccent = computed<MenuItemAccent>(() => (accent === 'brand' ? 'neutral' : accent))
</script>
