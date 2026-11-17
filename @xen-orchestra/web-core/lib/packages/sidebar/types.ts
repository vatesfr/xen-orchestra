import type { ResizableWidth } from '@core/composables/resizable-width.composable.ts'

export const SIDES = ['left', 'right'] as const

export type SidebarSide = (typeof SIDES)[number]

export type SidebarState = ResizableWidth & {
  isExpanded: boolean
  isLocked: boolean
  toggleExpand: (value?: boolean) => boolean
  toggleLock: (value?: boolean) => boolean
  cssWidth: string
  cssLockedOffset: string | number
  cssUnlockedOffset: string | number
}

export const SIDEBAR_DEFAULTS = {
  left: { isExpanded: true, isLocked: true },
  right: { isExpanded: false, isLocked: false },
} satisfies Record<SidebarSide, Pick<SidebarState, 'isExpanded' | 'isLocked'>>
