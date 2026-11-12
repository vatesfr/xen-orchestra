import { useXoCurrentUserPrivilegeCollection } from '@/modules/user/remote-resources/use-xo-current-user-privilege-collection.ts'
import { useXoCurrentUser } from '@/modules/user/remote-resources/use-xo-current-user.ts'
import { hasPrivilegeOn, type SupportedActions, type SupportedResource } from '@xen-orchestra/acl'
import { computed } from 'vue'

export function useCurrentUserPrivileges() {
  const { currentUser } = useXoCurrentUser()

  const isAdmin = computed(() => currentUser.value?.permission === 'admin')

  const shouldFetchPrivileges = computed(() => currentUser.value !== undefined && !isAdmin.value)

  const { currentUserPrivileges, areCurrentUserPrivilegesReady } = useXoCurrentUserPrivilegeCollection({
    isEnabled: shouldFetchPrivileges,
  })

  const isReady = computed(
    () => currentUser.value !== undefined && (isAdmin.value || areCurrentUserPrivilegesReady.value)
  )

  function can<TResource extends SupportedResource>({
    resource,
    action,
    objects,
  }: {
    resource: TResource
    action: SupportedActions<TResource>
    objects: object | object[]
  }) {
    if (currentUser.value === undefined || !isReady.value) {
      return false
    }

    if (isAdmin.value) {
      return true
    }

    try {
      return hasPrivilegeOn({
        user: currentUser.value,
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
