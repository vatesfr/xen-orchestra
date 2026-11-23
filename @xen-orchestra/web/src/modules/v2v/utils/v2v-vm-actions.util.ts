import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'

// In a menu, the main action of a VM leads, the other actions set apart below it by a separator
export function getV2vVmMenuActions(
  mainAction: LeafActionItem | undefined,
  moreActions: LeafActionItem[]
): LeafActionItem[] {
  if (mainAction === undefined) {
    return moreActions
  }

  return [mainAction, ...moreActions.map((action, index) => (index === 0 ? { ...action, separator: true } : action))]
}
