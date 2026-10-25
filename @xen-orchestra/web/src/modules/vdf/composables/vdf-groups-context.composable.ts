import type { VdfGroup } from '@/modules/vdf/types.ts'
import { computed, inject, type InjectionKey, type MaybeRefOrGetter, provide, toValue } from 'vue'

// The groups of the document a page shows, for the group chips inside it:
// a chip names a group, the context says what it is (its networks, vdf#36)
const VDF_GROUPS_KEY: InjectionKey<MaybeRefOrGetter<Record<string, VdfGroup>>> = Symbol('vdf-groups')

export const provideVdfGroups = (groups: MaybeRefOrGetter<Record<string, VdfGroup>>) => provide(VDF_GROUPS_KEY, groups)

export function useVdfGroup(name: MaybeRefOrGetter<string>) {
  const groups = inject(VDF_GROUPS_KEY, undefined)

  return computed(() => (groups === undefined ? undefined : toValue(groups)[toValue(name)]))
}
