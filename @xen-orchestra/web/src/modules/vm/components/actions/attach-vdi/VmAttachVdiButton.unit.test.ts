import { useVdiAttach } from '@/modules/vdi/composables/use-vdi-attach.composable.ts'
import VmAttachVdiButton from '@/modules/vm/components/actions/attach-vdi/VmAttachVdiButton.vue'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'

// The composable runs the attachment job, which calls the REST API
const vdiAttach = createJobStub(useVdiAttach, result => ({
  openVdiAttachDrawer: result.run,
  isAttachingVdi: result.isRunning,
}))

itRunsJobFromButton(VmAttachVdiButton, {
  targetProp: 'vm',
  createTarget: createVm,
  getButton: wrapper => wrapper.getComponent(MenuTrigger),
  job: vdiAttach,
  offer: { label: t('action:attach-vdi'), icon: 'action:attach' },
  // The composable receives the VM as a getter
  toJobTarget: vm => vm,
  disabledWhenCannotRun: false,
})
