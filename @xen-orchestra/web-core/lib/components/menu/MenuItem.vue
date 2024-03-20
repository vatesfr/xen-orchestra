<template>
  <li class="menu-item">
    <MenuTrigger
      v-if="!$slots.submenu"
      :active="isBusy"
      :busy="isBusy"
      :disabled="isDisabled"
      :icon="icon"
      @click="handleClick"
    >
      <slot />
    </MenuTrigger>
    <AppMenu v-else :disabled="isDisabled" shadow>
      <template #trigger="{ open, isOpen }">
        <MenuTrigger :active="isOpen" :busy="isBusy" :disabled="isDisabled" :icon="icon" @click="open">
          <slot />
          <UiIcon :fixed-width="false" :icon="submenuIcon" class="submenu-icon" />
        </MenuTrigger>
      </template>
      <slot name="submenu" />
    </AppMenu>
  </li>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import AppMenu from '@core/components/menu/UiMenu.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { IK_CLOSE_MENU, IK_MENU_HORIZONTAL } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { computed, inject, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    icon?: IconDefinition
    onClick?: () => any
    disabled?: boolean
    busy?: boolean
  }>(),
  { disabled: undefined }
)

const isParentHorizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
const isDisabled = useContext(DisabledContext, () => props.disabled)

const submenuIcon = computed(() => (isParentHorizontal.value ? faAngleDown : faAngleRight))

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
  color: var(--color-grey-000);
}

.submenu-icon {
  margin-left: auto;
}
</style>
