import { useBrowserMediaSessions } from '@/modules/browser-media/composables/use-browser-media-sessions.composable.ts'
import {
  type FrontXoBrowserMedia,
  useXoBrowserMediaCollection,
} from '@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

/**
 * Eject the ISO streamed from a browser into the VM, whether this tab serves it or another browser does.
 */
export const useXoBrowserMediaEjectJob = defineJob('browser-media.eject', [xoVmArg], () => {
  const { t } = useI18n()
  const { getLocalSession, eject } = useBrowserMediaSessions()
  const { getBrowserMediaByVmId, reloadBrowserMediaSessions } = useXoBrowserMediaCollection()

  function getRemoteSession(vmId: XoVm['id']): FrontXoBrowserMedia | undefined {
    const session = getBrowserMediaByVmId(vmId)

    return session?.id === getLocalSession(vmId)?.sessionId ? undefined : session
  }

  return {
    async run(vm) {
      const vmId = vm.id

      try {
        if (getLocalSession(vmId) !== undefined) {
          await eject(vmId)
        } else {
          const session = getRemoteSession(vmId)

          if (session !== undefined) {
            await fetchPost(`browser-media/${session.id}/actions/eject?sync=true`)
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
