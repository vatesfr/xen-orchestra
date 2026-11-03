import V2vNotFoundVmActions from '@/modules/v2v/components/panel/V2vNotFoundVmActions.vue'
import { createV2vNotFoundMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
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

const VM = createV2vNotFoundMappingStepVm()

describeV2vVmKindActions({
  mountActions: () =>
    mount(V2vNotFoundVmActions, { props: { vm: VM }, slots: V2V_VM_ACTIONS_SLOTS, global: createGlobalTestConfig() }),
  useActions: v2vVmActionsMock.useV2vNotFoundVmActions,
  vm: VM,
  isRemovable: true,
})
