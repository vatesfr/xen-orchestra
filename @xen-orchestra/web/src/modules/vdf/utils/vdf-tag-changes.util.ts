import type { VdfNotInheritedTags, VdfTagChange } from '@/modules/vdf/types.ts'

// The vdf: tags this VM did not inherit from its source, which it still
// lacks, per strip (vdf#141): none once it has them all, or once the entry
// left the pool's history
export function notInheritedTagsOf(
  tagChanges: VdfTagChange[],
  vm: { id: string; tags: string[] }
): VdfNotInheritedTags[] {
  return tagChanges
    .filter((change): change is VdfNotInheritedTags => change.kind === 'notInherited' && change.object.id === vm.id)
    .map(change => ({ ...change, tags: change.tags.filter(tag => !vm.tags.includes(tag)) }))
    .filter(change => change.tags.length > 0)
}
