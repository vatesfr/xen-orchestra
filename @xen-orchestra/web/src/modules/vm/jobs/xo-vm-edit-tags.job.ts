import { xoVmArg, xoVmTagChangesArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchDelete, fetchPut } from '@/shared/utils/fetch.util.ts'
import type { TagSelectChanges } from '@core/components/tag-select/VtsTagSelect.vue'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVmEditTagsJob = defineJob('vm.edit-tags', [xoVmArg, xoVmTagChangesArg], () => {
  const { t } = useI18n()

  return {
    async run(vm: FrontXoVm, { added, removed }: TagSelectChanges): Promise<PromiseSettledResult<unknown>[]> {
      const results = await Promise.allSettled([
        ...added.map(tag => fetchPut<void>(`vms/${vm.id}/tags/${encodeURIComponent(tag)}`)),
        ...removed.map(tag => fetchDelete(`vms/${vm.id}/tags/${encodeURIComponent(tag)}`)),
      ])

      results.forEach(result => {
        if (result.status === 'rejected') {
          console.error(result.reason)
        }
      })

      return results
    },

    validate(isRunning, vm, changes) {
      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (vm === undefined) {
        throw new JobError(t('job:vm-edit-tags:missing-vm'))
      }

      if (changes === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if ([...changes.added, ...changes.removed].includes('')) {
        throw new JobError(t('job:vm-edit-tags:missing-tag'))
      }
    },
  }
})
