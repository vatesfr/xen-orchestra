import V2vVmActions from '@/modules/v2v/components/panel/V2vVmActions.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import type { VueWrapper } from '@vue/test-utils'
import { type ComputedRef, toValue } from 'vue'

type V2vVmKindActions = { editAction?: ComputedRef<LeafActionItem>; moreActions: ComputedRef<LeafActionItem[]> }

type V2vVmKindActionsCase = {
  mountActions: () => VueWrapper
  // The mocked composable of the kind, from `mock-v2v-vm-actions.ts`
  useActions: { mock: { lastCall?: unknown[]; results: { value: unknown }[] } }
  vm: V2vMappingStepVm
  isRemovable: boolean
}

// Every per-kind action component hands the actions of its kind composable to `V2vVmActions`: the settings edit, if
// any, as main action, the others in its menu. Needs the composables mocked with `mock-v2v-vm-actions.ts`
export function describeV2vVmKindActions({ mountActions, useActions, vm, isRemovable }: V2vVmKindActionsCase) {
  describe('kind actions', () => {
    it('runs the actions on its VM', () => {
      mountActions()

      expect(toValue(useActions.mock.lastCall?.[0])).toEqual(vm)
    })

    it('offers the settings edit, if any, as main action, the other actions in its menu', () => {
      const wrapper = mountActions()
      const actions = useActions.mock.results.at(-1)?.value as V2vVmKindActions

      expect(wrapper.getComponent(V2vVmActions).props()).toEqual({
        mainAction: actions.editAction?.value,
        moreActions: actions.moreActions.value,
      })
    })

    if (isRemovable) {
      it('emits the removal of its VM, for the caller to confirm it', () => {
        const wrapper = mountActions()
        const context = useActions.mock.lastCall?.[1] as { remove: (id: V2vMappingStepVm['id']) => void }

        context.remove(vm.id)

        expect(wrapper.emitted('remove')).toEqual([[vm.id]])
      })
    }
  })
}
