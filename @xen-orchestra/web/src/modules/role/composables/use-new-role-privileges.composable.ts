import type { NewPrivilegePayload, StagedPrivilege } from '@/modules/role/types.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

function stagePrivileges(privileges: NewPrivilegePayload[]): StagedPrivilege[] {
  return privileges.map(privilege => ({ ...privilege, key: crypto.randomUUID() }))
}

export function useNewRolePrivileges() {
  const privileges = ref<StagedPrivilege[]>([])

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

    // Editing can turn a single privilege into several, since one action makes one privilege.
    privileges.value.splice(index, 1, ...stagePrivileges(response.payload))
  }

  function removePrivilege(privilege: StagedPrivilege) {
    privileges.value = privileges.value.filter(({ key }) => key !== privilege.key)
  }

  return { privileges, addPrivileges, editPrivilege, removePrivilege }
}
