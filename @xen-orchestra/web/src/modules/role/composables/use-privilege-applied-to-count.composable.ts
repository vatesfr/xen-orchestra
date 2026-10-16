import { usePrivilegeSelectorMatches } from '@/modules/role/composables/use-privilege-selector-matches.composable.ts'
import type { NewPrivilegePayload } from '@/modules/role/types.ts'
import { isSelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { getPrivilegeScopeType, parseManualSelectionSelector } from '@/modules/role/utils/privilege-scope.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function usePrivilegeAppliedToCount(privilegeRaw: MaybeRefOrGetter<NewPrivilegePayload>) {
  const privilege = toComputed(privilegeRaw)

  const scopeType = computed(() => getPrivilegeScopeType(privilege.value.selector))

  const selectableResource = computed(() =>
    isSelectablePrivilegeResource(privilege.value.resource) ? privilege.value.resource : undefined
  )

  const { matches, isReady } = usePrivilegeSelectorMatches({
    resource: selectableResource,
    selector: () => privilege.value.selector ?? '',
    isEnabled: () => scopeType.value !== 'manual-selection' && selectableResource.value !== undefined,
  })

  return computed(() => {
    if (scopeType.value === 'manual-selection') {
      return parseManualSelectionSelector(privilege.value.selector ?? '')?.length
    }

    return isReady.value ? matches.value.length : undefined
  })
}
