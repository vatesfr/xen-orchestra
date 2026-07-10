export const SIDES = ['left', 'right'] as const

export type SidebarSide = (typeof SIDES)[number]

export type SidebarState = {
  isExpanded: boolean
  isLocked: boolean
  width: number
  toggleExpand: (value?: boolean) => boolean
  toggleLock: (value?: boolean) => boolean
  startResize: (event: MouseEvent) => void
  isResizing: boolean
  cssWidth: string
  cssLockedOffset: string | number
  cssUnlockedOffset: string | number
}

export const SIDEBAR_DEFAULTS = {
  left: { isExpanded: true, isLocked: true, width: 350 },
  right: { isExpanded: false, isLocked: false, width: 350 },
} satisfies Record<SidebarSide, Pick<SidebarState, 'isExpanded' | 'isLocked' | 'width'>>
