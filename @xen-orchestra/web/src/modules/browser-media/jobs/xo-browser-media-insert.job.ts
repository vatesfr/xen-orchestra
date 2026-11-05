import { useBrowserMediaSessions } from '@/modules/browser-media/composables/use-browser-media-sessions.composable.ts'
import { useXoBrowserMediaCollection } from '@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'
import { isValidIsoSize } from '@/modules/browser-media/utils/xo-browser-media.util.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { VM_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

const INSERTABLE_POWER_STATES: VM_POWER_STATE[] = [VM_POWER_STATE.RUNNING, VM_POWER_STATE.HALTED]

// picked when running the job, so it is not part of its identity
const fileArg = defineJobArg<File | undefined>({ identify: false, toArray: false })

/**
 * Serve an ISO from this browser tab, and insert it in the CD drive of the VM.
 *
 * Without a file, only tells whether an ISO can be inserted, e.g. before picking one.
 */
export const useXoBrowserMediaInsertJob = defineJob('browser-media.insert', [xoVmArg, fileArg], () => {
  const { t } = useI18n()
  const { getLocalSession, hasEnded, insert } = useBrowserMediaSessions()
  const { getBrowserMediaByVmId } = useXoBrowserMediaCollection()
  const { getVbdsByIds, areVbdsReady } = useXoVbdCollection()

  return {
    run(vm, file) {
      if (file === undefined) {
        throw new JobError(t('job:browser-media-insert:missing-file'))
      }

      return insert(vm.id, file)
    },

    validate(isRunning, vm, file) {
      if (vm === undefined) {
        throw new JobError(t('job:arg:vm-id-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:browser-media-insert:in-progress'))
      }

      const localSession = getLocalSession(vm.id)
      // the polled list of xo-server may still have a session this tab ended, e.g. while it is ejected
      const serverSession = getBrowserMediaByVmId(vm.id)
      if (
        (localSession !== undefined && localSession.status !== 'ended') ||
        (serverSession !== undefined && !hasEnded(serverSession.id))
      ) {
        throw new JobError(t('job:browser-media-insert:already-inserted'))
      }

      if (!INSERTABLE_POWER_STATES.includes(vm.power_state)) {
        throw new JobError(t('job:browser-media-insert:bad-power-state'))
      }

      if (vm.high_availability !== '') {
        throw new JobError(t('job:browser-media-insert:high-availability'))
      }

      const vbds = getVbdsByIds(vm.$VBDs)

      // what the CD drives allow is not known yet
      if (!areVbdsReady.value || vbds.length !== vm.$VBDs.length) {
        throw new JobError(t('loading'))
      }

      const cdDrives = vbds.filter(vbd => vbd.is_cd_drive)

      if (cdDrives.some(vbd => vbd.VDI !== undefined)) {
        throw new JobError(t('job:browser-media-insert:cd-not-empty'))
      }

      if (vm.power_state === VM_POWER_STATE.RUNNING && !cdDrives.some(vbd => vbd.attached)) {
        throw new JobError(t('job:browser-media-insert:cd-drive-requires-halted-vm'))
      }

      if (file !== undefined && !isValidIsoSize(file.size)) {
        throw new JobError(t('job:browser-media-insert:invalid-file'))
      }
    },
  }
})
