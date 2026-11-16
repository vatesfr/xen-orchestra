import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import type { ComputedRef } from 'vue'

// The settings edit, if any, comes first, the other actions apart: the panel as a button, a row menu above a separator
export type V2vVmActionList = {
  mainAction?: LeafActionItem
  moreActions: LeafActionItem[]
}

export type V2vVmKindActionRefs = {
  editAction?: ComputedRef<LeafActionItem>
  moreActions: ComputedRef<LeafActionItem[]>
}
