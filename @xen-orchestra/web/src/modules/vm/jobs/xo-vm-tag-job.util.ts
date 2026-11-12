import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { JobError } from '@core/packages/job'
import type { useI18n } from 'vue-i18n'

export function getValidVmTagJobArgs(
  t: ReturnType<typeof useI18n>['t'],
  vm: FrontXoVm | undefined,
  tag: string | undefined
) {
  if (vm === undefined) {
    throw new JobError(t('job:vm-tag:missing-vm'))
  }

  if (tag === undefined || tag.trim() === '') {
    throw new JobError(t('job:vm-tag:missing-tag'))
  }

  return { vm, tag }
}
