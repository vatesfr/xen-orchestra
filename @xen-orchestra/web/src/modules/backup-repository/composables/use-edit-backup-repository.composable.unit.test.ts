import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import {
  type EditBackupRepositoryPayload,
  useXoBackupRepositoryEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { itRunsJobFromDrawer } from '@/test/drawer-job.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { Ref } from 'vue'

const editJob = createJobStub(useXoBackupRepositoryEditJob)

mockOverlay()

const PAYLOAD: EditBackupRepositoryPayload = {
  name: 'Weekly backups',
  url: 'nfs://192.168.1.20:/exports/backups',
  options: null,
  proxy: null,
}

beforeEach(() => {
  editJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountEditBackupRepository(br: FrontXoBackupRepository = createBr()) {
  return mountComposable(() => useEditBackupRepository(br)).wrapper.vm
}

function findJobArgs() {
  const [br, payload] = editJob.use.mock.calls[0] as [Ref<FrontXoBackupRepository>, Ref<EditBackupRepositoryPayload>]

  return { target: br.value, payload: payload.value }
}

describe('job', () => {
  it('exposes whether the repository can be edited, is being edited, and why it cannot be', () => {
    editJob.setState({ canRun: false, isRunning: true, errorMessage: 'Edition in progress' })

    const result = mountEditBackupRepository()

    expect(result.canEditBackupRepository).toBe(false)
    expect(result.isEditingBackupRepository).toBe(true)
    expect(result.editBackupRepositoryErrorMessage).toBe('Edition in progress')
  })
})

describe('editBackupRepository', () => {
  it('opens the drawer with the repository', () => {
    const br = createBr({ name: 'Nightly backups' })

    mountEditBackupRepository(br).editBackupRepository()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: expect.objectContaining({ br }) })
  })
})

describe('drawer', () => {
  itRunsJobFromDrawer({
    subject: 'repository',
    createTarget: () => createBr({ name: 'Nightly backups' }),
    mount: mountEditBackupRepository,
    run: editJob.run,
    findJobArgs,
    payload: PAYLOAD,
    errorMessage: 'Edition failed',
  })
})
