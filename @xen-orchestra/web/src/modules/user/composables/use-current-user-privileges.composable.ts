import { useXoCurrentUserPrivilegeCollection } from '@/modules/user/remote-resources/use-xo-current-user-privilege-collection.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import { hasPrivilegeOn, type SupportedActions, type SupportedResource } from '@xen-orchestra/acl'
import { computed } from 'vue'

export function useCurrentUserPrivileges() {
  const { user } = useXoUserResource({}, 'me')

  const isAdmin = computed(() => user.value?.permission === 'admin')

  const shouldFetchPrivileges = computed(() => user.value !== undefined && !isAdmin.value)

  const { currentUserPrivileges, areCurrentUserPrivilegesReady } = useXoCurrentUserPrivilegeCollection({
    isEnabled: shouldFetchPrivileges,
  })

  const isReady = computed(() => user.value !== undefined && (isAdmin.value || areCurrentUserPrivilegesReady.value))

  function can<TResource extends SupportedResource>({
    resource,
    action,
    objects,
  }: {
    resource: TResource
    action: SupportedActions<TResource>
    objects: object | object[]
  }) {
    if (user.value === undefined || !isReady.value) {
      return false
    }

    if (isAdmin.value) {
      return true
    }

    try {
      return hasPrivilegeOn({
        user: user.value,
        userPrivileges: currentUserPrivileges.value,
        resource,
        action,
        objects,
      })
    } catch (error) {
      console.error(error)

      return false
    }
  }

  return { can, isReady }
}
