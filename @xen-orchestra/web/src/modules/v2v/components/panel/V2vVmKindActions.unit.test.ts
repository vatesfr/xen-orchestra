import V2vNewVmActions from '@/modules/v2v/components/panel/V2vNewVmActions.vue'
import V2vNotFoundVmActions from '@/modules/v2v/components/panel/V2vNotFoundVmActions.vue'
import V2vResumedVmActions from '@/modules/v2v/components/panel/V2vResumedVmActions.vue'
import V2vVmKindActions from '@/modules/v2v/components/panel/V2vVmKindActions.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import {
  createV2vNewMappingStepVm,
  createV2vNotFoundMappingStepVm,
  createV2vResumedMappingStepVm,
} from '@/test/create-v2v-mapping-step-vm.ts'
import { findShownComponents } from '@/test/find-shown-components.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { findV2vVmSlotActions, getV2vVmKindActionList, V2V_VM_ACTIONS_SLOTS } from '@/test/v2v-vm-kind-actions.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

const NEW_VM = createV2vNewMappingStepVm()

const RESUMED_VM = createV2vResumedMappingStepVm()

const NOT_FOUND_VM = createV2vNotFoundMappingStepVm()

const updateVm = vi.fn()

function mountKindActions(vm: V2vMappingStepVm) {
  return mount(V2vVmKindActions, {
    props: { vm, updateVm },
    slots: V2V_VM_ACTIONS_SLOTS,
    global: createGlobalTestConfig(),
  })
}

const KIND_ACTIONS = [V2vNewVmActions, V2vResumedVmActions, V2vNotFoundVmActions]

function findKindActions(wrapper: VueWrapper) {
  return findShownComponents(wrapper, KIND_ACTIONS)
}

it.each([
  ['a new VM, stored through the list', NEW_VM, V2vNewVmActions, { vm: NEW_VM, updateVm }],
  ['a resumed VM', RESUMED_VM, V2vResumedVmActions, { vm: RESUMED_VM }],
  ['a VM not found in the source', NOT_FOUND_VM, V2vNotFoundVmActions, { vm: NOT_FOUND_VM }],
] as const)('runs the actions of %s', (_, vm, kindActions, props) => {
  const wrapper = mountKindActions(vm)

  expect(findKindActions(wrapper)).toEqual([kindActions])
  expect(wrapper.getComponent(kindActions).props()).toEqual(props)
})

it.each([
  ['a new VM', NEW_VM, v2vVmActionsMock.useV2vNewVmActions],
  ['a resumed VM', RESUMED_VM, v2vVmActionsMock.useV2vResumedVmActions],
  ['a VM not found in the source', NOT_FOUND_VM, v2vVmActionsMock.useV2vNotFoundVmActions],
] as const)('hands its slot the actions of %s', (_, vm, useActions) => {
  const wrapper = mountKindActions(vm)

  expect(findV2vVmSlotActions(wrapper)).toEqual(getV2vVmKindActionList(useActions))
})

it('switches to the actions of the new VM a resumed one becomes once its import VM is deleted', async () => {
  const wrapper = mountKindActions(RESUMED_VM)

  await wrapper.setProps({ vm: NEW_VM })

  expect(findKindActions(wrapper)).toEqual([V2vNewVmActions])
})

it.each([
  ['a new VM', NEW_VM, V2vNewVmActions],
  ['a VM not found in the source', NOT_FOUND_VM, V2vNotFoundVmActions],
] as const)('emits the removal of %s', async (_, vm, kindActions) => {
  const wrapper = mountKindActions(vm)

  await wrapper.getComponent(kindActions).vm.$emit('remove', vm.id)

  expect(wrapper.emitted('remove')).toEqual([[vm.id]])
})
