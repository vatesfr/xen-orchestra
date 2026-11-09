import {
  type AclPrivilegeMatch,
  useXoAclPrivilegeMatchesCollection,
} from '@/modules/role/remote-resources/use-xo-acl-privilege-matches-collection.ts'
import {
  type PrivilegeSelectorMatch,
  useXoPrivilegeSelectorMatchesCollection,
} from '@/modules/role/remote-resources/use-xo-privilege-selector-matches-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function toAclPrivilegeSelectorMatches(
  privileges: AclPrivilegeMatch[],
  getRoleById: (id: AclPrivilegeMatch['roleId']) => FrontXoRole | undefined
): PrivilegeSelectorMatch[] {
  return privileges.flatMap(privilege => {
    const role = getRoleById(privilege.roleId)

    if (role === undefined) {
      return []
    }

    return [
      { id: privilege.id, name: `${role.name} (${privilege.resource} · ${privilege.action} · ${privilege.effect})` },
    ]
  })
}

export function usePrivilegeSelectorMatches(config: {
  resource: MaybeRefOrGetter<SelectablePrivilegeResource | undefined>
  selector: MaybeRefOrGetter<string>
  isEnabled: MaybeRefOrGetter<boolean>
}) {
  const resource = toComputed(config.resource)

  const isEnabled = toComputed(config.isEnabled)

  const isAclPrivilege = computed(() => resource.value === 'acl-privilege')

  const areAclPrivilegesEnabled = computed(() => isEnabled.value && isAclPrivilege.value)

  const objectResource = computed(() => (resource.value === 'acl-privilege' ? undefined : resource.value))

  const { matches: objectMatches, $context: objectMatchesContext } = useXoPrivilegeSelectorMatchesCollection(
    { isEnabled: computed(() => isEnabled.value && objectResource.value !== undefined) },
    objectResource,
    config.selector
  )

  const { privileges, $context: privilegesContext } = useXoAclPrivilegeMatchesCollection(
    { isEnabled: areAclPrivilegesEnabled },
    config.selector
  )

  const { getRoleById, areRolesReady, hasRoleFetchError } = useXoRoleCollection({ isEnabled: areAclPrivilegesEnabled })

  return {
    matches: computed(() =>
      isAclPrivilege.value ? toAclPrivilegeSelectorMatches(privileges.value, getRoleById) : objectMatches.value
    ),
    isReady: computed(() =>
      isAclPrivilege.value ? privilegesContext.isReady.value && areRolesReady.value : objectMatchesContext.isReady.value
    ),
    hasError: computed(() =>
      isAclPrivilege.value
        ? privilegesContext.hasError.value || hasRoleFetchError.value
        : objectMatchesContext.hasError.value
    ),
  }
}
