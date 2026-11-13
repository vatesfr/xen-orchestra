import type { NewPrivilegePayload, StagedPrivilege } from '@/modules/role/types.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

function stagePrivileges(privileges: NewPrivilegePayload[]): StagedPrivilege[] {
  return privileges.map(privilege => ({ ...privilege, key: crypto.randomUUID() }))
}

export function useNewRolePrivileges(initialPrivileges: NewPrivilegePayload[] = []) {
  const privileges = ref<StagedPrivilege[]>(stagePrivileges(initialPrivileges))

  const { open } = useOverlay({
    component: () => import('@/modules/role/components/drawer/NewPrivilegeDrawer.vue'),
    events: {
      onConfirm: (newPrivileges: NewPrivilegePayload[]) => newPrivileges,
      onCancel: true,
    },
  })

  async function addPrivileges() {
    const response = await open()

    if (response.event !== 'onConfirm') {
      return
    }

    privileges.value.push(...stagePrivileges(response.payload))
  }

  async function editPrivilege(privilege: StagedPrivilege) {
    const response = await open({ props: { privilegeToEdit: privilege } })

    if (response.event !== 'onConfirm') {
      return
    }

    const index = privileges.value.findIndex(({ key }) => key === privilege.key)

    privileges.value.splice(index, 1, ...stagePrivileges(response.payload))
  }

  function removePrivilege(privilege: StagedPrivilege) {
    privileges.value = privileges.value.filter(({ key }) => key !== privilege.key)
  }

  return { privileges, addPrivileges, editPrivilege, removePrivilege }
}
