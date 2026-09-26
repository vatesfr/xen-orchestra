import { useBrowserMediaSessions } from '@/modules/browser-media/composables/use-browser-media-sessions.composable.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBrowserMediaDisconnectJob = defineJob('browser-media.disconnect', [xoVmArg], () => {
  const { t } = useI18n()
  const browserMedia = useBrowserMediaSessions()

  return {
    run(vm) {
      return browserMedia.remove(vm.id)
    },

    validate(isRunning, vm) {
      if (vm === undefined) {
        throw new JobError(t('job:browser-media-disconnect:missing-vm'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:browser-media-disconnect:in-progress'))
      }

      if (!browserMedia.sessions.has(vm.id)) {
        throw new JobError(t('job:browser-media-disconnect:not-connected'))
      }
    },
  }
})
