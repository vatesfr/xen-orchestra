import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'

export function createActionItem(overrides: Partial<LeafActionItem> = {}): LeafActionItem {
  return {
    label: 'Action',
    icon: 'action:connect',
    onClick: () => {},
    disabled: false,
    busy: false,
    hint: undefined,
    ...overrides,
  }
}
