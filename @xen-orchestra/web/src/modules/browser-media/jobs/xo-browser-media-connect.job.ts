import { useBrowserMediaSessions } from '@/modules/browser-media/composables/use-browser-media-sessions.composable.ts'
import type { XoBrowserMediaCreated } from '@/modules/browser-media/types/xo-browser-media.type.ts'
import { getBrowserMediaErrorReason } from '@/modules/browser-media/utils/xo-browser-media.util.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { VM_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

// must match xo-server's limits
const SECTOR_SIZE = 512
const MIN_ISO_SIZE = 32 * 1024
const MAX_ISO_SIZE = 128 * 1024 ** 3

const ATTACHABLE_POWER_STATES: VM_POWER_STATE[] = [VM_POWER_STATE.RUNNING, VM_POWER_STATE.HALTED]

// picked when running the job, so it is not part of its identity
const fileArg = defineJobArg<File | undefined>({ identify: false, toArray: false })

export const useXoBrowserMediaConnectJob = defineJob('browser-media.connect', [xoVmArg, fileArg], () => {
  const { t } = useI18n()
  const browserMedia = useBrowserMediaSessions()

  function getErrorMessage(error: unknown) {
    const reason = getBrowserMediaErrorReason(error)

    if (reason !== 'unknown') {
      return t(`job:browser-media-connect:${reason}`)
    }

    if (error instanceof ApiError && typeof error.cause?.error === 'string') {
      return error.cause.error
    }

    return (error as Error).message
  }

  return {
    async run(vm, file) {
      if (file === undefined) {
        throw new JobError(t('job:browser-media-connect:missing-file'))
      }

      const session = browserMedia.start(vm.id, file.name)

      try {
        const { id, socket } = await fetchPost<XoBrowserMediaCreated>('browser-media', {
          vmId: vm.id,
          name: file.name,
          size: file.size,
        })
        session.id = id

        await browserMedia.serve(vm.id, socket, file)

        // synchronous, so that a refusal comes with the reason
        await fetchPost(`browser-media/${id}/actions/attach?sync=true`)
        session.status = 'connected'
      } catch (error) {
        browserMedia.fail(vm.id, new Error(getErrorMessage(error)))
        throw error
      }
    },

    validate(isRunning, vm, file) {
      if (vm === undefined) {
        throw new JobError(t('job:browser-media-connect:missing-vm'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:browser-media-connect:in-progress'))
      }

      if (browserMedia.sessions.has(vm.id)) {
        throw new JobError(t('job:browser-media-connect:already-connected'))
      }

      if (!ATTACHABLE_POWER_STATES.includes(vm.power_state)) {
        throw new JobError(t('job:browser-media-connect:bad-power-state'))
      }

      if (
        file !== undefined &&
        (file.size < MIN_ISO_SIZE || file.size > MAX_ISO_SIZE || file.size % SECTOR_SIZE !== 0)
      ) {
        throw new JobError(t('job:browser-media-connect:invalid-file'))
      }
    },
  }
})
