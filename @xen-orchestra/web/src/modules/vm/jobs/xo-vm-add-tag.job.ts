import { xoVmArg, xoVmTagArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import { getValidVmTagJobArgs } from '@/modules/vm/jobs/xo-vm-tag-job.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVmAddTagJob = defineJob('vm.add-tag', [xoVmArg, xoVmTagArg], () => {
  const { t } = useI18n()

  return {
    run(vm: FrontXoVm, tag: string) {
      return fetchPut<void>(`vms/${vm.id}/tags/${encodeURIComponent(tag)}`)
    },

    validate(isRunning, maybeVm: FrontXoVm | undefined, maybeTag: string | undefined) {
      const { vm, tag } = getValidVmTagJobArgs(t, maybeVm, maybeTag)

      if (isRunning) {
        throw new JobRunningError(t('job:vm-add-tag:in-progress'))
      }

      if (vm.tags.includes(tag)) {
        throw new JobError(t('job:vm-add-tag:already-present'))
      }
    },
  }
})
