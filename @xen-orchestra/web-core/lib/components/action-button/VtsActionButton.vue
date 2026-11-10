<template>
  <Teleport v-if="isInMenu || collapsedMenu" :to="collapsedMenu?.target" :disabled="isInMenu">
    <MenuItem :accent="menuItemAccent" :icon :disabled :busy :on-click="handleMenuItemClick">
      <slot />
      <i v-if="disabled && hint" class="em-dash-prefix">{{ hint }}</i>
    </MenuItem>
  </Teleport>
  <UiButton
    v-else-if="!isCollapsed"
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
import { IK_IN_MENU, IK_PANEL_ACTIONS } from '@core/utils/injection-keys.util.ts'
import { useCurrentElement } from '@vueuse/core'
import { computed, inject, toValue } from 'vue'

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

const isInMenu = inject(IK_IN_MENU, false)

const panelActions = isInMenu ? undefined : inject(IK_PANEL_ACTIONS, undefined)

const isCollapsed = panelActions?.register(useCurrentElement()) ?? false

const collapsedMenu = computed(() => (toValue(isCollapsed) ? panelActions?.menu.value : undefined))

const menuItemAccent = computed<MenuItemAccent>(() => (accent === 'brand' ? 'neutral' : accent))

async function handleMenuItemClick() {
  await onClick?.()

  collapsedMenu.value?.close()
}
</script>
