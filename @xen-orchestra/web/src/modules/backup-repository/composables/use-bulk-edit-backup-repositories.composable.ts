import {
  type BulkEditBackupRepositoryPayloads,
  useXoBackupRepositoryBulkEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useBulkEditBackupRepositories(rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>) {
  const brs = toComputed(rawBrs)

  const payloads = ref<BulkEditBackupRepositoryPayloads>()

  const {
    run,
    canRun: canEditBackupRepositories,
    isRunning: isEditingBackupRepositories,
    errorMessage: editBackupRepositoriesErrorMessage,
  } = useXoBackupRepositoryBulkEditJob(brs, payloads)

  async function edit(newPayloads: BulkEditBackupRepositoryPayloads) {
    payloads.value = newPayloads

    try {
      const results = await run()

      if (results.some(result => result.status === 'rejected')) {
        return KEEP_OVERLAY_OPEN
      }
    } catch (error) {
      console.error('Error when editing backup repositories', error)
      return KEEP_OVERLAY_OPEN
    }
  }

  const { open: openEditDrawer } = useOverlay({
    component: () => import('@/modules/backup-repository/components/drawer/EditBackupRepositoryDrawer.vue'),
    events: {
      onConfirm: (payload: EditBackupRepositoryPayload) => edit(new Map(brs.value.map(br => [br.id, payload]))),
      onCancel: true,
    },
  })

  const { open: openBulkEditDrawer } = useOverlay({
    component: () => import('@/modules/backup-repository/components/drawer/BulkEditBackupRepositoriesDrawer.vue'),
    events: {
      onConfirm: edit,
      onCancel: true,
    },
  })

  function editBackupRepositories() {
    const [firstBr] = brs.value

    if (brs.value.length === 1 && firstBr !== undefined) {
      return openEditDrawer({ props: { br: firstBr } })
    }

    return openBulkEditDrawer({ props: { brs: brs.value } })
  }

  return {
    editBackupRepositories,
    canEditBackupRepositories,
    isEditingBackupRepositories,
    editBackupRepositoriesErrorMessage,
  }
}
