<template>
  <slot :is-open :open name="trigger" />
  <Teleport to="body">
    <Transition name="slide">
      <UiPanel
        v-if="isOpen"
        :aria-labelledby="titleId"
        :style="{ transition: transformTransition }"
        aria-modal="true"
        class="vts-mobile-menu"
        role="dialog"
      >
        <template #header>
          <UiButtonIcon
            :aria-label="backLabel"
            :target-scale="2"
            accent="brand"
            icon="fa:angle-left"
            size="small"
            @click="goBack()"
          />
          <span :id="titleId" class="typo-h6">
            <component :is="currentSubmenu.title" v-if="currentSubmenu" />
            <template v-else>{{ title }}</template>
          </span>
        </template>
        <MenuList class="menu" no-border>
          <VtsDropdownTitle v-if="sectionTitle !== undefined">{{ sectionTitle }}</VtsDropdownTitle>
          <component :is="currentSubmenu.content" v-if="currentSubmenu" />
          <slot v-else />
        </MenuList>
      </UiPanel>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { PANEL_TRANSITION_DURATION } from '@core/stores/panel.store.ts'
import { IK_CLOSE_MENU, IK_MOBILE_MENU } from '@core/utils/injection-keys.util.ts'
import { onKeyStroke } from '@vueuse/core'
import { computed, provide, ref, shallowRef, type Slot, useId } from 'vue'
import { useI18n } from 'vue-i18n'

export type MobileSubmenu = {
  title: Slot
  content: Slot
}

export type MobileMenuController = {
  openSubmenu: (submenu: MobileSubmenu) => void
}

const { title, sectionTitle } = defineProps<{
  title: string
  sectionTitle?: string
}>()

const emit = defineEmits<{
  action: []
}>()

defineSlots<{
  default(): any
  trigger(props: { open: () => void; isOpen: boolean }): any
}>()

const { t } = useI18n()

const overlayStore = useOverlayStore()

const titleId = useId()

const isOpen = ref(false)
const submenus = shallowRef<MobileSubmenu[]>([])

const currentSubmenu = computed(() => submenus.value.at(-1))

const backLabel = computed(() => (currentSubmenu.value ? t('action:go-back') : t('action:close')))

const transformTransition = `transform ${PANEL_TRANSITION_DURATION}ms`

function open() {
  submenus.value = []
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function closeAfterAction() {
  if (!isOpen.value) {
    return
  }

  close()
  emit('action')
}

function goBack() {
  if (submenus.value.length === 0) {
    close()
    return
  }

  submenus.value = submenus.value.slice(0, -1)
}

function openSubmenu(submenu: MobileSubmenu) {
  submenus.value = [...submenus.value, submenu]
}

onKeyStroke(
  'Escape',
  event => {
    if (event.defaultPrevented || overlayStore.overlays.length > 0) {
      return
    }

    goBack()
  },
  { target: () => (isOpen.value ? window : undefined) }
)

provide(IK_CLOSE_MENU, closeAfterAction)
provide(IK_MOBILE_MENU, { openSubmenu })
</script>

<style lang="postcss" scoped>
.vts-mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 1010;
  border: none;
  border-radius: 0;

  &.slide-enter-from,
  &.slide-leave-to {
    transform: translateX(100%);
  }

  :deep(> .content) {
    padding: 0;
    overflow: auto;
  }

  :deep(.menu) {
    display: flex;
    border-radius: 0;
  }

  :deep(.vts-dropdown-title),
  :deep(.menu-item) {
    border-block-end: 0.1rem solid var(--color-neutral-border);
  }

  :deep(.menu-separator),
  :deep(.vts-divider) {
    display: none;
  }
}
</style>
