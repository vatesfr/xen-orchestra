import V2vNotFoundVmActions from '@/modules/v2v/components/panel/V2vNotFoundVmActions.vue'
import { createV2vNotFoundMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { mountV2vVmKindActions, describeV2vVmKindActions } from '@/test/v2v-vm-kind-actions.ts'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

const VM = createV2vNotFoundMappingStepVm()

describeV2vVmKindActions({
  mountActions: () => mountV2vVmKindActions(V2vNotFoundVmActions, { vm: VM }),
  useActions: v2vVmActionsMock.useV2vNotFoundVmActions,
  vm: VM,
  isRemovable: true,
})
