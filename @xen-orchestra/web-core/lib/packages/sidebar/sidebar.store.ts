import { useResizableWidth } from '@core/composables/resizable-width.composable.ts'
import { SIDEBAR_DEFAULTS, type SidebarSide } from '@core/packages/sidebar/types.ts'
import { useSidebarResponsiveExpand } from '@core/packages/sidebar/use-sidebar-responsive-expand.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useLocalStorage, useToggle } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

function createSidebar(side: SidebarSide) {
  const uiStore = useUiStore()
  const prefix = `sidebar.${side}`
  const defaults = SIDEBAR_DEFAULTS[side]

  const isExpanded = useLocalStorage(`${prefix}.expanded`, defaults.isExpanded)
  const isLocked = useLocalStorage(`${prefix}.locked`, defaults.isLocked)

  const toggleExpand = useToggle(isExpanded)
  const toggleLock = useToggle(isLocked)
  const resizableWidth = useResizableWidth(side, `${prefix}.custom-width`)

  useSidebarResponsiveExpand(isExpanded)

  const cssWidth = computed(() => (uiStore.isSmall ? '100%' : `${resizableWidth.width.value}px`))

  const cssLockedOffset = computed(() => (isExpanded.value ? '0' : `-${cssWidth.value}`))

  const cssUnlockedOffset = computed(() => {
    if (isExpanded.value) {
      return '0'
    }

    return side === 'left' ? `-${cssWidth.value}` : cssWidth.value
  })

  return {
    isExpanded,
    isLocked,
    toggleExpand,
    toggleLock,
    cssWidth,
    cssLockedOffset,
    cssUnlockedOffset,
    ...resizableWidth,
  }
}

export const useLeftSidebarStore = defineStore('sidebar-left', () => createSidebar('left'))
export const useRightSidebarStore = defineStore('sidebar-right', () => createSidebar('right'))

export function useSidebar(side: SidebarSide = 'left') {
  return side === 'left' ? useLeftSidebarStore() : useRightSidebarStore()
}
