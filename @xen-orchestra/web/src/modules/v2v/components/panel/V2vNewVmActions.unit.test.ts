import V2vNewVmActions from '@/modules/v2v/components/panel/V2vNewVmActions.vue'
import { createV2vNewMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { describeV2vVmKindActions, V2V_VM_ACTIONS_SLOTS } from '@/test/v2v-vm-kind-actions.ts'
import { mount } from '@vue/test-utils'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

const VM = createV2vNewMappingStepVm()

function mountActions(updateVm = vi.fn()) {
  return mount(V2vNewVmActions, {
    props: { vm: VM, updateVm },
    slots: V2V_VM_ACTIONS_SLOTS,
    global: createGlobalTestConfig(),
  })
}

it('stores the settings of its VM through the list', () => {
  const updateVm = vi.fn()

  mountActions(updateVm)

  expect(v2vVmActionsMock.useV2vNewVmActions.mock.lastCall?.[1].updateVm).toBe(updateVm)
})

describeV2vVmKindActions({
  mountActions: () => mountActions(),
  useActions: v2vVmActionsMock.useV2vNewVmActions,
  vm: VM,
  isRemovable: true,
})
