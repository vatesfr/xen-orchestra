import {
  type FrontXoBrowserMedia,
  useXoBrowserMediaCollection,
} from '@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'
import { useBrowserMediaSessionsStore } from '@/modules/browser-media/stores/browser-media-sessions.store.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoBrowserMediaSession, XoTask, XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

/**
 * Eject the ISO streamed from a browser into the VM, whether this tab serves it or another browser does.
 */
export const useXoBrowserMediaEjectJob = defineJob('browser-media.eject', [xoVmArg], () => {
  const { t } = useI18n()
  const { getLocalSession, eject } = useBrowserMediaSessionsStore()
  const { monitorTask } = useXoTaskUtils()
  const { getBrowserMediaByVmId, reloadBrowserMediaSessions } = useXoBrowserMediaCollection()

  async function requestEject(sessionId: XoBrowserMediaSession['id']) {
    try {
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`browser-media/${sessionId}/actions/eject`)
      await monitorTask(taskId)
    } catch (error) {
      // already released by xo-server, e.g. ejected from elsewhere meanwhile
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error
      }
    }
  }

  function getRemoteSession(vmId: XoVm['id']): FrontXoBrowserMedia | undefined {
    const session = getBrowserMediaByVmId(vmId)

    return session?.id === getLocalSession(vmId)?.sessionId ? undefined : session
  }

  return {
    async run(vm) {
      const vmId = vm.id

      try {
        if (getLocalSession(vmId) !== undefined) {
          await eject(vmId, requestEject)
        } else {
          const session = getRemoteSession(vmId)

          if (session !== undefined) {
            await requestEject(session.id)
          }
        }
      } finally {
        await reloadBrowserMediaSessions()
      }
    },

    validate(isRunning, vm) {
      if (vm === undefined) {
        throw new JobError(t('job:arg:vm-id-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:browser-media-eject:in-progress'))
      }

      const localSession = getLocalSession(vm.id)

      if (localSession?.status === 'ejecting') {
        throw new JobRunningError(t('job:browser-media-eject:in-progress'))
      }

      if (localSession?.status !== 'inserted' && getRemoteSession(vm.id)?.status !== 'inserted') {
        throw new JobError(t('job:browser-media-eject:not-inserted'))
      }
    },
  }
})
