<!-- v1.0 -->
<template>
  <li class="menu-item" :class="className">
    <MenuTrigger
      v-if="!$slots.submenu"
      :accent
      :active="isBusy"
      :busy="isBusy"
      :disabled="isDisabled"
      :icon
      class="typo-body-bold-small"
      @click="handleClick"
    >
      <slot />
    </MenuTrigger>
    <MenuList v-else :disabled="isDisabled">
      <template #trigger="{ open, isOpen }">
        <MenuTrigger
          :accent
          :active="isOpen"
          :busy="isBusy"
          :disabled="isDisabled"
          class="typo-body-bold-small"
          :icon
          @click="open"
        >
          <slot />
          <VtsIcon :name="submenuIcon" size="medium" class="submenu-icon" />
        </MenuTrigger>
      </template>
      <slot name="submenu" />
    </MenuList>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import type { IconName } from '@core/icons'
import { IK_CLOSE_MENU, IK_MENU_HORIZONTAL } from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, inject, ref } from 'vue'

export type MenuItemAccent = 'neutral' | 'brand' | 'danger' | 'warning'

const { icon, onClick, disabled, busy, accent } = defineProps<{
  icon?: IconName
  onClick?: () => any
  disabled?: boolean
  busy?: boolean
  accent: MenuItemAccent
}>()

const className = computed(() => toVariants({ accent }))

const isParentHorizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
const isDisabled = useDisabled(() => disabled)

const submenuIcon = computed((): IconName => (isParentHorizontal.value ? 'fa:angle-down' : 'fa:angle-right'))

const isHandlingClick = ref(false)
const isBusy = computed(() => isHandlingClick.value || busy === true)
const closeMenu = inject(IK_CLOSE_MENU, undefined)

const handleClick = async () => {
  if (isDisabled.value || isBusy.value) {
    return
  }

  isHandlingClick.value = true
  try {
    await onClick?.()
    closeMenu?.()
  } finally {
    isHandlingClick.value = false
  }
}
</script>

<style lang="postcss" scoped>
.menu-item {
  &.accent--neutral {
    color: var(--color-neutral-txt-primary);
  }

  &.accent--brand {
    color: var(--color-brand-txt-base);
  }

  &.accent--danger {
    color: var(--color-danger-txt-base);
  }

  &.accent--warning {
    color: var(--color-warning-txt-base);
  }
}

.submenu-icon {
  margin-left: auto;
}
</style>
