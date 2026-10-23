import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useXoRoleGroupsAddJob } from '@/modules/role/jobs/xo-role-groups-add.job.ts'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useGroupRolesAdd(rawGroup: MaybeRefOrGetter<FrontXoGroup>) {
  const group = toComputed(rawGroup)

  const { t } = useI18n()

  const { roles } = useXoRoleCollection()

  const selectableRoles = computed(() => roles.value.filter(role => !role.groupIds.includes(group.value.id)))

  const rolesToAdd = ref<FrontXoRole[]>([])

  const { run, isRunning: isAddingRoles } = useXoRoleGroupsAddJob(rolesToAdd, () => [group.value])

  const canAddRoles = computed(() => selectableRoles.value.length > 0)

  const { open } = useOverlay({
    component: () => import('@/modules/role/components/drawer/SelectRolesDrawer.vue'),
    events: {
      onConfirm: (selectedRoles: FrontXoRole[]) => selectedRoles,
      onCancel: true,
    },
  })

  async function addRoles() {
    const response = await open({ props: { roles: selectableRoles.value, title: t('action:add-roles') } })

    if (response.event !== 'onConfirm') {
      return
    }

    rolesToAdd.value = response.payload

    run({ detached: true })
  }

  return { addRoles, canAddRoles, isAddingRoles }
}
