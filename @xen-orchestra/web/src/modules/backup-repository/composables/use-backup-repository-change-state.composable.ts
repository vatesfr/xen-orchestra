import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useBackupRepositoryChangeState(rawBr: MaybeRefOrGetter<FrontXoBackupRepository>) {
  const br = toComputed(rawBr)

  const { $context } = useXoBackupRepositoryCollection()

  const {
    run,
    canRun: canChangeBackupRepositoryState,
    isRunning: isChangingBackupRepositoryState,
    errorMessage: changeBackupRepositoryStateErrorMessage,
  } = useXoBackupRepositoryChangeStateJob(br, () => !br.value.enabled)

  async function changeBackupRepositoryState() {
    try {
      await run()

      // Force reload while waiting for reactivity to be implemented for XO objects (XO-1013)
      $context.forceReload()
    } catch (error) {
      console.error('Error when changing backup repository state:', error)
    }
  }

  return {
    changeBackupRepositoryState,
    canChangeBackupRepositoryState,
    isChangingBackupRepositoryState,
    changeBackupRepositoryStateErrorMessage,
  }
}
