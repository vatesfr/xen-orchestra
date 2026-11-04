import V2vNewVmActions from '@/modules/v2v/components/panel/V2vNewVmActions.vue'
import { createV2vNewMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { mountV2vVmKindActions, describeV2vVmKindActions } from '@/test/v2v-vm-kind-actions.ts'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

const VM = createV2vNewMappingStepVm()

function mountActions(updateVm = vi.fn()) {
  return mountV2vVmKindActions(V2vNewVmActions, { vm: VM, updateVm })
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
