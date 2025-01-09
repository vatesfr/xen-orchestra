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
    <MenuList v-else :disabled="isDisabled" border>
      <template #trigger="{ open, isOpen }">
        <MenuTrigger :active="isOpen" :busy="isBusy" :disabled="isDisabled" :icon @click="open">
          <slot />
          <VtsIcon :fixed-width="false" :icon="submenuIcon" accent="current" class="submenu-icon" />
        </MenuTrigger>
      </template>
      <slot name="submenu" />
    </MenuList>
  </li>
</template>

<script lang="ts">
/** @deprecated Use VtsMenuItem or VtsMenuTrigger */
</script>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
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
  color: var(--color-neutral-txt-primary);
}

.submenu-icon {
  margin-left: auto;
}
</style>
