import { useXoVmEditTagsJob } from '@/modules/vm/jobs/xo-vm-edit-tags.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { TagSelectChanges } from '@core/components/tag-select/VtsTagSelect.vue'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmTagsEdition(vm: MaybeRefOrGetter<FrontXoVm>) {
  const changes = ref<TagSelectChanges>()

  const { run, isRunning: isSaving } = useXoVmEditTagsJob(vm, changes)

  function saveTags(newChanges: TagSelectChanges) {
    changes.value = newChanges

    run({ detached: true })
  }

  return { saveTags, isSaving }
}
