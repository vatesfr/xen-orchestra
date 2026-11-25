import VmDuplicateButton from '@/modules/vm/components/actions/duplicate/VmDuplicateButton.vue'
import { useVmDuplicate } from '@/modules/vm/composables/use-vm-duplicate.composable.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { getMenuTrigger } from '@core-test/menu.ts'

// The composable runs the duplication job, which calls the REST API
const vmDuplicate = createJobStub(useVmDuplicate, result => ({
  duplicateVm: result.run,
  canDuplicateVm: result.canRun,
  isDuplicatingVm: result.isRunning,
}))

const mountButton = itRunsJobFromButton(VmDuplicateButton, {
  targetProp: 'vm',
  createTarget: createVm,
  getButton: getMenuTrigger,
  job: vmDuplicate,
  offer: { label: t('action:duplicate'), icon: 'action:duplicate' },
  // The composable receives the VM as a getter
  toJobTarget: vm => vm,
})

it('is busy, not disabled, while the VM is being duplicated', () => {
  vmDuplicate.setState({ canRun: false, isRunning: true })

  const button = getMenuTrigger(mountButton())

  expect(button.props('busy')).toBe(true)
  expect(button.props('disabled')).toBe(false)
})
