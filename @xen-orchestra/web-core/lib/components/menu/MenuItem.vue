<!-- v1.0 -->
<template>
  <li class="menu-item" role="none">
    <MenuTrigger
      v-if="!slots.submenu || mobileMenu"
      :accent
      :active="isBusy"
      :busy="isBusy"
      :disabled="isDisabled"
      :icon
      class="typo-body-bold-small"
      @click="handleClick()"
      @pointermove="(event: PointerEvent) => handlePointerMove(event)"
      @pointerleave="(event: PointerEvent) => handlePointerLeave(event)"
    >
      <slot />
      <VtsIcon v-if="slots.submenu" name="fa:angle-right" size="medium" />
    </MenuTrigger>
    <MenuList v-else ref="submenu" v-model:open="isSubmenuOpen" :anchor="triggerElement" :disabled="isDisabled">
      <template #trigger="{ bindings }">
        <MenuTrigger
          ref="trigger"
          v-bind="bindings"
          :accent
          :busy="isBusy"
          :disabled="isDisabled"
          :icon
          :selected="isSubmenuOpen"
          class="typo-body-bold-small"
          @click="openSubmenu()"
          @keydown="(event: KeyboardEvent) => openSubmenuOnKeydown(event)"
          @pointermove="(event: PointerEvent) => handlePointerMove(event)"
          @pointerleave="(event: PointerEvent) => handlePointerLeave(event)"
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
import { useMenuLevel } from '@core/composables/menu-level.composable.ts'
import type { IconName } from '@core/icons'
import { IK_CLOSE_MENU, IK_MENU_HORIZONTAL, IK_MENU_LEVEL, IK_MOBILE_MENU } from '@core/utils/injection-keys.util.ts'
import { unrefElement } from '@vueuse/core'
import { computed, inject, nextTick, ref, useId, useTemplateRef } from 'vue'

export type MenuItemAccent = 'neutral' | 'brand' | 'danger' | 'warning'

const { onClick, disabled, busy } = defineProps<{
  icon?: IconName
  onClick?: () => any
  disabled?: boolean
  busy?: boolean
  accent: MenuItemAccent
}>()

const slots = defineSlots<{
  default(): any
  submenu?(): any
}>()

const isParentHorizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
const isDisabled = useDisabled(() => disabled)

const submenuIcon = computed((): IconName => (isParentHorizontal.value ? 'fa:angle-down' : 'fa:angle-right'))

const submenuKey = computed(() => (isParentHorizontal.value ? 'ArrowDown' : 'ArrowRight'))

const isHandlingClick = ref(false)
const isBusy = computed(() => isHandlingClick.value || busy === true)
const closeMenu = inject(IK_CLOSE_MENU, undefined)
const mobileMenu = inject(IK_MOBILE_MENU, undefined)

const id = useId()
const level = inject(IK_MENU_LEVEL, () => useMenuLevel({ isPopup: false, horizontal: false }), true)
const trigger = useTemplateRef('trigger')
const submenu = useTemplateRef('submenu')

const triggerElement = computed(() => {
  const element = unrefElement(trigger)

  return element instanceof HTMLElement ? element : undefined
})

const isSubmenuOpen = computed({
  get: () => level.openedItemId.value === id,
  set: isOpen => (isOpen ? level.openItem(id) : level.closeItem(id)),
})

const handleClick = async () => {
  if (isDisabled.value || isBusy.value) {
    return
  }

  if (slots.submenu !== undefined) {
    mobileMenu?.openSubmenu({ title: slots.default, content: slots.submenu })
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

async function openSubmenu() {
  if (isDisabled.value) {
    return
  }

  level.openItem(id)

  await nextTick()
  submenu.value?.focusFirstItem()
}

function openSubmenuOnKeydown(event: KeyboardEvent) {
  if (event.key !== submenuKey.value) {
    return
  }

  event.preventDefault()
  openSubmenu()
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') {
    return
  }

  level.hoverItem(
    { itemId: id, hasSubmenu: slots.submenu !== undefined && mobileMenu === undefined && !isDisabled.value },
    event
  )
}

function handlePointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') {
    level.leaveItem(id, event)
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
