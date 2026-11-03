import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vVmActionList } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import type { VueWrapper } from '@vue/test-utils'
import { type ComputedRef, defineComponent, h, type PropType, toValue } from 'vue'

// Stands for what the caller of a kind action component lays its actions out as
const V2vVmActionListStub = defineComponent({
  props: {
    mainAction: Object as PropType<LeafActionItem>,
    moreActions: Array as PropType<LeafActionItem[]>,
  },
  setup: () => () => null,
})

// The slot to mount a kind action component with, for `findV2vVmSlotActions` to read the actions it hands to its slot
export const V2V_VM_ACTIONS_SLOTS = {
  default: (actions: V2vVmActionList) => h(V2vVmActionListStub, actions),
}

export function findV2vVmSlotActions(wrapper: Pick<VueWrapper, 'getComponent'>): V2vVmActionList {
  return wrapper.getComponent(V2vVmActionListStub).props() as V2vVmActionList
}

type V2vVmKindActions = { editAction?: ComputedRef<LeafActionItem>; moreActions: ComputedRef<LeafActionItem[]> }

// A mocked composable of a kind, from `mock-v2v-vm-actions.ts`
type V2vVmKindActionsMock = { mock: { lastCall?: unknown[]; results: { value: unknown }[] } }

// The actions the last call of a mocked kind composable returned, as a kind action component hands them to its slot
export function getV2vVmKindActionList(useActions: V2vVmKindActionsMock): V2vVmActionList {
  const { editAction, moreActions } = useActions.mock.results.at(-1)?.value as V2vVmKindActions

  return { mainAction: editAction?.value, moreActions: moreActions.value }
}

type V2vVmKindActionsCase = {
  mountActions: () => VueWrapper
  useActions: V2vVmKindActionsMock
  vm: V2vMappingStepVm
  isRemovable: boolean
}

// Every per-kind action component hands the actions of its kind composable to its slot: the settings edit, if any, as
// main action, the others apart. `mountActions` mounts it with `V2V_VM_ACTIONS_SLOTS`. Needs the composables mocked
// with `mock-v2v-vm-actions.ts`
export function describeV2vVmKindActions({ mountActions, useActions, vm, isRemovable }: V2vVmKindActionsCase) {
  describe('kind actions', () => {
    it('runs the actions on its VM', () => {
      mountActions()

      expect(toValue(useActions.mock.lastCall?.[0])).toEqual(vm)
    })

    it('hands its slot the settings edit, if any, as main action, then the other actions', () => {
      const wrapper = mountActions()

      expect(findV2vVmSlotActions(wrapper)).toEqual(getV2vVmKindActionList(useActions))
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
