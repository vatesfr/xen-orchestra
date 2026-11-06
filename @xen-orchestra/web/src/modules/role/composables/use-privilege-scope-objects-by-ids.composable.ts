import { usePrivilegeScopeObjects } from '@/modules/role/composables/use-privilege-scope-objects.composable.ts'
import type { PrivilegeScopeObject } from '@/modules/role/types.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function usePrivilegeScopeObjectsByIds(
  resource: MaybeRefOrGetter<SelectablePrivilegeResource | undefined>,
  ids: MaybeRefOrGetter<string[]>
) {
  const { objects, isReady, hasError } = usePrivilegeScopeObjects(resource)

  const objectsById = computed(() => new Map(objects.value.map(object => [object.id, object])))

  const objectsByIds = computed<PrivilegeScopeObject[]>(() =>
    toValue(ids).map(id => objectsById.value.get(id) ?? { id, label: id })
  )

  return { objects: objectsByIds, isReady, hasError }
}
