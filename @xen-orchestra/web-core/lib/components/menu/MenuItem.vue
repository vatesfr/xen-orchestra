<!-- v1.0 -->
<template>
  <li class="menu-item">
    <MenuTrigger
      v-if="!$slots.submenu"
      :active="isBusy"
      :busy="isBusy"
      :disabled="isDisabled"
      :icon
      @click="handleClick"
    >
      <slot />
    </MenuTrigger>
    <MenuList v-else :disabled="isDisabled">
      <template #trigger="{ open, isOpen }">
        <MenuTrigger :active="isOpen" :busy="isBusy" :disabled="isDisabled" :icon @click="open">
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
import { useDisabled } from '@core/composables/disabled.composable'
import type { IconName } from '@core/icons'
import { IK_CLOSE_MENU, IK_MENU_HORIZONTAL } from '@core/utils/injection-keys.util'
import { computed, inject, ref } from 'vue'

const props = defineProps<{
  icon?: IconName
  onClick?: () => any
  disabled?: boolean
  busy?: boolean
}>()

const isParentHorizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
const isDisabled = useDisabled(() => props.disabled)

const submenuIcon = computed((): IconName => (isParentHorizontal.value ? 'fa:angle-down' : 'fa:angle-right'))

const isHandlingClick = ref(false)
const isBusy = computed(() => isHandlingClick.value || props.busy === true)
const closeMenu = inject(IK_CLOSE_MENU, undefined)

const handleClick = async () => {
  if (isDisabled.value || isBusy.value) {
    return
  }

  isHandlingClick.value = true
  try {
    await props.onClick?.()
    closeMenu?.()
  } finally {
    isHandlingClick.value = false
  }
}
</script>

<style lang="postcss" scoped>
.menu-item {
  color: var(--color-neutral-txt-primary);
}

.submenu-icon {
  margin-left: auto;
}
</style>
