import {
  useVmSpecialTagModal,
  type VmSpecialTagAction,
} from '@/modules/vm/composables/use-vm-special-tag-modal.composable.ts'
import { useXoVmAddTagJob } from '@/modules/vm/jobs/xo-vm-add-tag.job.ts'
import { useXoVmRemoveTagJob } from '@/modules/vm/jobs/xo-vm-remove-tag.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isSpecialVmTag } from '@/modules/vm/utils/xo-vm.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmTagsEdition(vm: MaybeRefOrGetter<FrontXoVm>) {
  const tagToAdd = ref('')
  const tagToRemove = ref('')

  const { run: runAddTag } = useXoVmAddTagJob(vm, tagToAdd)
  const { run: runRemoveTag } = useXoVmRemoveTagJob(vm, tagToRemove)

  const { openSpecialTagModal, openTagErrorModal } = useVmSpecialTagModal()

  const busyTags = ref<string[]>([])

  // the server says why it refuses a change (e.g. a reserved tag)
  function getErrorMessage(error: unknown) {
    const reason =
      error instanceof ApiError ? (error.cause?.data as { reason?: unknown } | undefined)?.reason : undefined

    return typeof reason === 'string' ? reason : String((error as Error).message ?? error)
  }

  async function trackRun(tag: string, action: VmSpecialTagAction, run: () => Promise<unknown>) {
    busyTags.value.push(tag)

    try {
      await run()
    } catch (error) {
      console.error(error)
      void openTagErrorModal(tag, action, getErrorMessage(error))
    } finally {
      busyTags.value.splice(busyTags.value.indexOf(tag), 1)
    }
  }

  function doAddTag(tag: string) {
    tagToAdd.value = tag
    void trackRun(tag, 'add', () => runAddTag())
  }

  function doRemoveTag(tag: string) {
    tagToRemove.value = tag
    void trackRun(tag, 'remove', () => runRemoveTag())
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
