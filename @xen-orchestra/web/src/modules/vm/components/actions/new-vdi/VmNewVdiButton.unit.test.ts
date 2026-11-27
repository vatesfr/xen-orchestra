import { useNewVdi } from '@/modules/vdi/composables/use-new-vdi.composable.ts'
import VmNewVdiButton from '@/modules/vm/components/actions/new-vdi/VmNewVdiButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { getMenuTrigger } from '@core-test/menu.ts'

// The composable runs the creation job, which calls the REST API
const newVdi = createJobStub(useNewVdi, result => ({
  openNewVdiDrawer: result.run,
  isCreatingVdi: result.isRunning,
}))

itRunsJobFromButton(VmNewVdiButton, {
  targetProp: 'vm',
  createTarget: createVm,
  getButton: getMenuTrigger,
  job: newVdi,
  offer: { label: t('action:create-vdi'), icon: 'fa:plus' },
  // The composable receives the VM as a getter
  toJobTarget: vm => vm,
  disabledWhenCannotRun: false,
})
