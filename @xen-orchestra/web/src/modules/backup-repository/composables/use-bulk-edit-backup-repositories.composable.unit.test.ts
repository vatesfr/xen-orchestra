import { useBulkEditBackupRepositories } from '@/modules/backup-repository/composables/use-bulk-edit-backup-repositories.composable.ts'
import {
  type BulkEditBackupRepositoryPayloads,
  useXoBackupRepositoryBulkEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createTwoBrs } from '@/test/create-br.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { toValue } from 'vue'

type MockedOverlay = {
  open: ReturnType<typeof vi.fn>
  events: { onConfirm: (payload: never) => Promise<unknown> }
}

// The job patches the repositories through the REST API
const bulkEditJob = createJobStub(useXoBackupRepositoryBulkEditJob)

mockOverlay()

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  bulkEditJob.reset()
  bulkEditJob.run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
})

const [firstBr, secondBr] = createTwoBrs()

const PAYLOAD: EditBackupRepositoryPayload = {
  name: 'My repository',
  url: 'nfs://192.168.1.10:/exports/backups',
  options: null,
  proxy: null,
}

function mountBulkEdit(brs: FrontXoBackupRepository[]) {
  const result = mountComposable(() => useBulkEditBackupRepositories(() => brs)).wrapper.vm

  // The composable declares the edit drawer of a single repository first, then the bulk edit one
  const [editDrawer, bulkEditDrawer] = overlayMock.getOverlays<MockedOverlay>()

  return { result, editDrawer, bulkEditDrawer }
}

// The job receives the payloads as a ref, filled when a drawer is confirmed
function findJobPayloads(): BulkEditBackupRepositoryPayloads | undefined {
  return toValue(bulkEditJob.use.mock.lastCall?.[1])
}

describe('editBackupRepositories', () => {
  it('opens the edit drawer of the repository when only one is selected', () => {
    const { result, editDrawer, bulkEditDrawer } = mountBulkEdit([firstBr])

    result.editBackupRepositories()

    expect(editDrawer.open).toHaveBeenCalledWith({ props: { br: firstBr } })
    expect(bulkEditDrawer.open).not.toHaveBeenCalled()
  })

  it('opens the bulk edit drawer when several repositories are selected', () => {
    const { result, editDrawer, bulkEditDrawer } = mountBulkEdit([firstBr, secondBr])

    result.editBackupRepositories()

    expect(bulkEditDrawer.open).toHaveBeenCalledWith({ props: { brs: [firstBr, secondBr] } })
    expect(editDrawer.open).not.toHaveBeenCalled()
  })
})

describe('on confirm', () => {
  it('runs the job with the payload of the edit drawer for the repository', async () => {
    const { editDrawer } = mountBulkEdit([firstBr])

    await editDrawer.events.onConfirm(PAYLOAD as never)

    expect(findJobPayloads()).toEqual(new Map([[firstBr.id, PAYLOAD]]))
    expect(bulkEditJob.run).toHaveBeenCalledOnce()
  })

  it('runs the job with the payloads of the bulk edit drawer', async () => {
    const payloads: BulkEditBackupRepositoryPayloads = new Map([
      [firstBr.id, PAYLOAD],
      [secondBr.id, { ...PAYLOAD, name: 'Other repository' }],
    ])
    const { bulkEditDrawer } = mountBulkEdit([firstBr, secondBr])

    await bulkEditDrawer.events.onConfirm(payloads as never)

    expect(findJobPayloads()).toEqual(payloads)
    expect(bulkEditJob.run).toHaveBeenCalledOnce()
  })

  it('closes the drawer once every repository is edited', async () => {
    const { bulkEditDrawer } = mountBulkEdit([firstBr, secondBr])

    expect(await bulkEditDrawer.events.onConfirm(new Map() as never)).toBeUndefined()
  })

  it('keeps the drawer open when a repository could not be edited', async () => {
    bulkEditJob.run.mockResolvedValue([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('Backup repository unreachable') },
    ])
    const { bulkEditDrawer } = mountBulkEdit([firstBr, secondBr])

    expect(await bulkEditDrawer.events.onConfirm(new Map() as never)).toBe(KEEP_OVERLAY_OPEN)
  })

  it('keeps the drawer open when the job fails', async () => {
    silenceConsoleError()
    bulkEditJob.run.mockRejectedValue(new Error('Missing changes for a backup repository'))
    const { editDrawer } = mountBulkEdit([firstBr])

    expect(await editDrawer.events.onConfirm(PAYLOAD as never)).toBe(KEEP_OVERLAY_OPEN)
  })
})

describe('job state', () => {
  it('exposes whether the repositories can be edited, and why not', () => {
    bulkEditJob.setState({ canRun: false, isRunning: true, errorMessage: 'Backup repositories edition in progress…' })

    const { result } = mountBulkEdit([firstBr, secondBr])

    expect(result).toMatchObject({
      canEditBackupRepositories: false,
      isEditingBackupRepositories: true,
      editBackupRepositoriesErrorMessage: 'Backup repositories edition in progress…',
    })
  })
})
