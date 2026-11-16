import type { V2vVmActionList } from '@/modules/v2v/types/v2v-vm-actions.type.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import type { ComputedRef } from 'vue'

type V2vVmKindActions = { editAction?: ComputedRef<LeafActionItem>; moreActions: ComputedRef<LeafActionItem[]> }

// A mocked composable of a kind, from `mock-v2v-vm-actions.ts`
type V2vVmKindActionsMock = { mock: { results: { value: unknown }[] } }

// The actions the last call of a mocked kind composable returned, as `V2vVmKindActions` hands them to its slot
export function getV2vVmKindActionList(useActions: V2vVmKindActionsMock): V2vVmActionList {
  const { editAction, moreActions } = useActions.mock.results.at(-1)?.value as V2vVmKindActions

  return { mainAction: editAction?.value, moreActions: moreActions.value }
}
