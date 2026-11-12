import V2vResumedVmActions from '@/modules/v2v/components/panel/V2vResumedVmActions.vue'
import { createV2vResumedMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { mountV2vVmKindActions, describeV2vVmKindActions } from '@/test/v2v-vm-kind-actions.ts'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

const VM = createV2vResumedMappingStepVm()

describeV2vVmKindActions({
  mountActions: () => mountV2vVmKindActions(V2vResumedVmActions, { vm: VM }),
  useActions: v2vVmActionsMock.useV2vResumedVmActions,
  vm: VM,
  isRemovable: false,
})
