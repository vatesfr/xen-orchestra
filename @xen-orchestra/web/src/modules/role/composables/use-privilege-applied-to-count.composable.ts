import { usePrivilegeAppliedToIds } from '@/modules/role/composables/use-privilege-applied-to-ids.composable.ts'
import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function usePrivilegeAppliedToCount(
  privilegeRaw: MaybeRefOrGetter<Pick<FrontXoPrivilege, 'resource' | 'selector'>>
) {
  const appliedToIds = usePrivilegeAppliedToIds(privilegeRaw)

  return computed(() => appliedToIds.value?.length)
}
