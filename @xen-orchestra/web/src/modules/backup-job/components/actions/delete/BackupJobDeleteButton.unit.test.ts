import BackupJobDeleteButton from '@/modules/backup-job/components/actions/delete/BackupJobDeleteButton.vue'
import type { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useDelete, deleteBackupJobs } = vi.hoisted(() => ({
  useDelete: vi.fn(),
  deleteBackupJobs: vi.fn(),
}))

vi.mock(import('@/modules/backup-job/composables/use-backup-job-delete.composable.ts'), () => ({
  useBackupJobDelete: useDelete as unknown as typeof useBackupJobDelete,
}))

beforeEach(() => {
  useDelete.mockReset()
  deleteBackupJobs.mockReset()

  mockDelete()
})

function mockDelete({ canRun = true, isRunning = false }: { canRun?: boolean; isRunning?: boolean } = {}) {
  useDelete.mockReturnValue({
    deleteBackupJobs,
    canDeleteBackupJobs: ref(canRun),
    isDeletingBackupJobs: ref(isRunning),
    deleteBackupJobsErrorMessage: ref(canRun ? undefined : 'Backup job deletion in progress…'),
  })
}

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

  const [backupJobs] = useDelete.mock.lastCall ?? []

  expect(toValue(backupJobs)).toEqual([backupJob])
})

it('deletes the backup job when clicking the button', async () => {
  await mountButton().get('button').trigger('click')

  expect(deleteBackupJobs).toHaveBeenCalledOnce()
})

it('disables the button and explains why when the backup job cannot be deleted', () => {
  mockDelete({ canRun: false })

  const button = mountButton().getComponent(VtsActionButton)

  expect(button.props('disabled')).toBe(true)
  expect(button.props('hint')).toBe('Backup job deletion in progress…')
})

it('shows the button as busy while the backup job is being deleted', () => {
  mockDelete({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
