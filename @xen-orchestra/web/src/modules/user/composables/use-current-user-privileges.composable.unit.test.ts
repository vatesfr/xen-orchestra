import { useCurrentUserPrivileges } from '@/modules/user/composables/use-current-user-privileges.composable.ts'
import type { useXoCurrentUserPrivilegeCollection } from '@/modules/user/remote-resources/use-xo-current-user-privilege-collection.ts'
import type { useXoCurrentUser } from '@/modules/user/remote-resources/use-xo-current-user.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import type { XoUser } from '@vates/types'
import type { AnyPrivilege, Privilege } from '@xen-orchestra/acl'
import { ref } from 'vue'

const { useXoCurrentUserMock, useXoCurrentUserPrivilegeCollectionMock } = vi.hoisted(() => ({
  useXoCurrentUserMock: vi.fn(),
  useXoCurrentUserPrivilegeCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-current-user.ts'), () => ({
  useXoCurrentUser: useXoCurrentUserMock as unknown as typeof useXoCurrentUser,
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-current-user-privilege-collection.ts'), () => ({
  useXoCurrentUserPrivilegeCollection:
    useXoCurrentUserPrivilegeCollectionMock as unknown as typeof useXoCurrentUserPrivilegeCollection,
}))

beforeEach(() => {
  useXoCurrentUserMock.mockReset()
  useXoCurrentUserPrivilegeCollectionMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function createUser(permission: XoUser['permission']): XoUser {
  return {
    id: 'user-1' as XoUser['id'],
    email: 'user@example.com',
    groups: [],
    permission,
    preferences: {},
  }
}

function createVmPrivilege(privilege: Pick<Privilege<'vm'>, 'action' | 'effect' | 'selector'>): AnyPrivilege {
  return {
    id: 'privilege-1' as AnyPrivilege['id'],
    roleId: 'role-1' as AnyPrivilege['roleId'],
    resource: 'vm',
    ...privilege,
  }
}

function setupCurrentUserPrivileges({
  currentUser,
  privileges = [],
  arePrivilegesReady = true,
}: {
  currentUser: XoUser | undefined
  privileges?: AnyPrivilege[]
  arePrivilegesReady?: boolean
}) {
  const areCurrentUserPrivilegesReady = ref(arePrivilegesReady)

  useXoCurrentUserMock.mockReturnValue({ currentUser: ref(currentUser) })

  useXoCurrentUserPrivilegeCollectionMock.mockReturnValue({
    currentUserPrivileges: ref(privileges),
    areCurrentUserPrivilegesReady,
  })

  return { ...useCurrentUserPrivileges(), areCurrentUserPrivilegesReady }
}

function isPrivilegeFetchEnabled(): boolean {
  return useXoCurrentUserPrivilegeCollectionMock.mock.lastCall?.[0].isEnabled.value
}

describe('useCurrentUserPrivileges', () => {
  describe('while the current user is not loaded', () => {
    it('is not ready and allows nothing', () => {
      const { can, isReady } = setupCurrentUserPrivileges({ currentUser: undefined })

      expect(isReady.value).toBe(false)
      expect(can({ resource: 'vm', action: 'start', objects: createVm() })).toBe(false)
    })

    it('does not fetch the privileges', () => {
      setupCurrentUserPrivileges({ currentUser: undefined })

      expect(isPrivilegeFetchEnabled()).toBe(false)
    })
  })

  describe('for an admin', () => {
    it('is ready and allows everything without fetching the privileges', () => {
      const { can, isReady } = setupCurrentUserPrivileges({
        currentUser: createUser('admin'),
        arePrivilegesReady: false,
      })

      expect(isPrivilegeFetchEnabled()).toBe(false)
      expect(isReady.value).toBe(true)
      expect(can({ resource: 'vm', action: 'start', objects: createVm() })).toBe(true)
    })
  })

  describe('for a non-admin user', () => {
    it('fetches the privileges', () => {
      setupCurrentUserPrivileges({ currentUser: createUser('none') })

      expect(isPrivilegeFetchEnabled()).toBe(true)
    })

    it('allows nothing until the privileges are loaded', () => {
      const { can, isReady, areCurrentUserPrivilegesReady } = setupCurrentUserPrivileges({
        currentUser: createUser('none'),
        privileges: [createVmPrivilege({ action: 'start', effect: 'allow' })],
        arePrivilegesReady: false,
      })

      expect(isReady.value).toBe(false)
      expect(can({ resource: 'vm', action: 'start', objects: createVm() })).toBe(false)

      areCurrentUserPrivilegesReady.value = true

      expect(isReady.value).toBe(true)
      expect(can({ resource: 'vm', action: 'start', objects: createVm() })).toBe(true)
    })

    it('refuses an action that no privilege grants', () => {
      const { can } = setupCurrentUserPrivileges({
        currentUser: createUser('none'),
        privileges: [createVmPrivilege({ action: 'start', effect: 'allow' })],
      })

      expect(can({ resource: 'vm', action: 'delete', objects: createVm() })).toBe(false)
    })

    it('only allows the objects matching the selector of the privilege', () => {
      const { can } = setupCurrentUserPrivileges({
        currentUser: createUser('none'),
        privileges: [createVmPrivilege({ action: 'start', effect: 'allow', selector: 'id:vm-allowed' })],
      })

      const allowedVm = createVm({ id: 'vm-allowed' as FrontXoVm['id'] })
      const otherVm = createVm({ id: 'vm-other' as FrontXoVm['id'] })

      expect(can({ resource: 'vm', action: 'start', objects: allowedVm })).toBe(true)
      expect(can({ resource: 'vm', action: 'start', objects: otherVm })).toBe(false)
      expect(can({ resource: 'vm', action: 'start', objects: [allowedVm, otherVm] })).toBe(false)
    })

    it('refuses an action denied by a privilege, even when another one grants it', () => {
      const { can } = setupCurrentUserPrivileges({
        currentUser: createUser('none'),
        privileges: [
          createVmPrivilege({ action: 'start', effect: 'allow' }),
          createVmPrivilege({ action: 'start', effect: 'deny' }),
        ],
      })

      expect(can({ resource: 'vm', action: 'start', objects: createVm() })).toBe(false)
    })

    it('refuses the action and logs the error when a privilege is not supported', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const unsupportedPrivilege = {
        ...createVmPrivilege({ action: 'start', effect: 'allow' }),
        action: 'unsupported-action',
      } as unknown as AnyPrivilege

      const { can } = setupCurrentUserPrivileges({
        currentUser: createUser('none'),
        privileges: [createVmPrivilege({ action: 'start', effect: 'allow' }), unsupportedPrivilege],
      })

      expect(can({ resource: 'vm', action: 'start', objects: createVm() })).toBe(false)
      expect(consoleError).toHaveBeenCalledOnce()
    })
  })
})
