import { usePrivilegeScopeObjects } from '@/modules/role/composables/use-privilege-scope-objects.composable.ts'
import type { PrivilegeScopeObject } from '@/modules/role/types.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function usePrivilegeScopeObjectsByIds(
  resource: MaybeRefOrGetter<SelectablePrivilegeResource | undefined>,
  ids: MaybeRefOrGetter<string[]>
) {
  const { objects } = usePrivilegeScopeObjects(resource)

  const objectsById = computed(() => new Map(objects.value.map(object => [object.id, object])))

  // An object deleted since it was selected is still part of the selector, so it stays listed by its id.
  return computed<PrivilegeScopeObject[]>(() => toValue(ids).map(id => objectsById.value.get(id) ?? { id, label: id }))
}
