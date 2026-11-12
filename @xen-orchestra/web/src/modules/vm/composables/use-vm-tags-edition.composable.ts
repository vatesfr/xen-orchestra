import { useVmSpecialTagModal } from '@/modules/vm/composables/use-vm-special-tag-modal.composable.ts'
import { useXoVmAddTagJob } from '@/modules/vm/jobs/xo-vm-add-tag.job.ts'
import { useXoVmRemoveTagJob } from '@/modules/vm/jobs/xo-vm-remove-tag.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isSpecialVmTag } from '@/modules/vm/utils/xo-vm.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmTagsEdition(vm: MaybeRefOrGetter<FrontXoVm>) {
  const tagToAdd = ref('')
  const tagToRemove = ref('')

  const { run: runAddTag } = useXoVmAddTagJob(vm, tagToAdd)
  const { run: runRemoveTag } = useXoVmRemoveTagJob(vm, tagToRemove)

  const { openSpecialTagModal } = useVmSpecialTagModal()

  const busyTags = ref<string[]>([])

  async function trackRun(tag: string, run: () => Promise<unknown>) {
    busyTags.value.push(tag)

    try {
      await run()
    } catch (error) {
      console.error(error)
    } finally {
      busyTags.value.splice(busyTags.value.indexOf(tag), 1)
    }
  }

  function doAddTag(tag: string) {
    tagToAdd.value = tag
    void trackRun(tag, () => runAddTag())
  }

  function doRemoveTag(tag: string) {
    tagToRemove.value = tag
    void trackRun(tag, () => runRemoveTag())
  }

  function addTag(tag: string) {
    if (!isSpecialVmTag(tag)) {
      doAddTag(tag)
      return
    }

    openSpecialTagModal(tag, 'add', () => doAddTag(tag))
  }

  function removeTag(tag: string) {
    if (!isSpecialVmTag(tag)) {
      doRemoveTag(tag)
      return
    }

    openSpecialTagModal(tag, 'remove', () => doRemoveTag(tag))
  }

  return { addTag, removeTag, busyTags }
}
