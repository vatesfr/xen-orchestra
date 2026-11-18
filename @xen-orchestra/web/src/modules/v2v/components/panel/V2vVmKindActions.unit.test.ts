import V2vVmKindActions from '@/modules/v2v/components/panel/V2vVmKindActions.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/types/v2v-mapping-step.type.ts'
import type { V2vVmActionList } from '@/modules/v2v/types/v2v-vm-actions.type.ts'
import { V2V_NEW_STEP_VM, V2V_RESUMED_STEP_VM, V2V_NOT_FOUND_STEP_VM } from '@/test/create-v2v-mapping-step-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { getV2vVmKindActionList } from '@/test/v2v-vm-kind-actions.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, type PropType, toValue } from 'vue'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

// Stands for what the caller lays the actions out as
const ActionListStub = defineComponent({
  props: {
    mainAction: Object as PropType<LeafActionItem>,
    moreActions: Array as PropType<LeafActionItem[]>,
  },
  setup: () => () => null,
})

const updateVm = vi.fn()

function mountKindActions(vm: V2vMappingStepVm) {
  return mount(V2vVmKindActions, {
    props: { vm, updateVm },
    slots: { default: (actions: V2vVmActionList) => h(ActionListStub, actions) },
    global: createGlobalTestConfig(),
  })
}

function findSlotActions(wrapper: VueWrapper) {
  return wrapper.getComponent(ActionListStub).props()
}

const { useV2vNewVmActions, useV2vResumedVmActions, useV2vNotFoundVmActions } = v2vVmActionsMock

const KINDS = [
  ['a new VM', V2V_NEW_STEP_VM, useV2vNewVmActions],
  ['a resumed VM', V2V_RESUMED_STEP_VM, useV2vResumedVmActions],
  ['a VM not found in the source', V2V_NOT_FOUND_STEP_VM, useV2vNotFoundVmActions],
] as const

it.each(KINDS)('runs the actions of %s on it, and those alone', (_, vm, useActions) => {
  mountKindActions(vm)

  expect(toValue(useActions.mock.lastCall?.[0])).toEqual(vm)
  expect(KINDS.map(([, , useKind]) => useKind).filter(useKind => useKind.mock.calls.length > 0)).toEqual([useActions])
})

it.each(KINDS)(
  'hands its slot the settings edit of %s, if any, as main action, then the others',
  (_, vm, useActions) => {
    expect(findSlotActions(mountKindActions(vm))).toEqual(getV2vVmKindActionList(useActions))
  }
)

it('stores the settings of a new VM through the list', () => {
  mountKindActions(V2V_NEW_STEP_VM)

  expect(useV2vNewVmActions.mock.lastCall?.[1].updateVm).toBe(updateVm)
})

it.each([
  ['a new VM', V2V_NEW_STEP_VM, () => useV2vNewVmActions.mock.lastCall?.[1].remove],
  ['a VM not found in the source', V2V_NOT_FOUND_STEP_VM, () => useV2vNotFoundVmActions.mock.lastCall?.[1].remove],
] as const)('emits the removal of %s, for the caller to confirm it', (_, vm, getRemove) => {
  const wrapper = mountKindActions(vm)

  getRemove()?.(vm.id)

  expect(wrapper.emitted('remove')).toEqual([[vm.id]])
})
