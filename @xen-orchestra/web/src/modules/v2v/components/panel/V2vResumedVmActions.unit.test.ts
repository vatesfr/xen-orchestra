import V2vResumedVmActions from '@/modules/v2v/components/panel/V2vResumedVmActions.vue'
import { createV2vResumedMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
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

const VM = createV2vResumedMappingStepVm()

describeV2vVmKindActions({
  mountActions: () =>
    mount(V2vResumedVmActions, { props: { vm: VM }, slots: V2V_VM_ACTIONS_SLOTS, global: createGlobalTestConfig() }),
  useActions: v2vVmActionsMock.useV2vResumedVmActions,
  vm: VM,
  isRemovable: false,
})
