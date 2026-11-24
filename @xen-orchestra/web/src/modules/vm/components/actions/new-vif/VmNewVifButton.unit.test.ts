import { useNewVif } from '@/modules/vif/composables/use-new-vif.composable.ts'
import VmNewVifButton from '@/modules/vm/components/actions/new-vif/VmNewVifButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'

// The composable runs the creation job, which calls the REST API
const newVif = createJobStub(useNewVif, result => ({
  openNewVifDrawer: result.run,
  isCreatingVif: result.isRunning,
}))

const mountButton = itRunsJobFromButton(VmNewVifButton, {
  targetProp: 'vm',
  createTarget: createVm,
  getButton: wrapper => wrapper.getComponent(UiButton),
  job: newVif,
  // The composable receives the VM as a getter
  toJobTarget: vm => vm,
  disabledWhenCannotRun: false,
})

it('offers to create a VIF', () => {
  const button = mountButton().getComponent(UiButton)

  expect(button.text()).toBe(t('new-vif'))
  expect(button.props('leftIcon')).toBe('fa:plus')
})
