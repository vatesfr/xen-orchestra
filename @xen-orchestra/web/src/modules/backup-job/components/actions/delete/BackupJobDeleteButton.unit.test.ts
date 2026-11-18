import BackupJobDeleteButton from '@/modules/backup-job/components/actions/delete/BackupJobDeleteButton.vue'
import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

const deleteJob = createJobStub(useBackupJobDelete, result =>
  toJobComposableResult(result, 'deleteBackupJobs', 'isDeletingBackupJobs')
)

beforeEach(() => {
  deleteJob.reset()
})

function mountButton(backupJob: FrontAnyXoBackupJob = createVmBackupJob()) {
  return mount(BackupJobDeleteButton, {
    props: { backupJob },
    global: createGlobalTestConfig(),
  })
}

it('offers to delete the backup job', () => {
  const button = mountButton().getComponent(VtsActionButton)

  expect(button.text()).toBe(t('action:delete'))
  expect(button.props('icon')).toBe('action:delete')
  expect(button.props('accent')).toBe('danger')
})

it('deletes the backup job', () => {
  const backupJob = createVmBackupJob()
  mountButton(backupJob)

  const [backupJobs] = deleteJob.use.mock.lastCall ?? []

  expect(toValue(backupJobs)).toEqual([backupJob])
})

it('deletes the backup job when clicking the button', async () => {
  await mountButton().get('button').trigger('click')

  expect(deleteJob.run).toHaveBeenCalledOnce()
})

it('disables the button and explains why when the backup job cannot be deleted', () => {
  deleteJob.setState({ canRun: false, errorMessage: 'Backup job deletion in progress…' })

  const button = mountButton().getComponent(VtsActionButton)

  expect(button.props('disabled')).toBe(true)
  expect(button.props('hint')).toBe('Backup job deletion in progress…')
})

it('shows the button as busy while the backup job is being deleted', () => {
  deleteJob.setState({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
