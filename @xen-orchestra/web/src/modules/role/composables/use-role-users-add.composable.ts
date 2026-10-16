import { useXoRoleUsersAddJob } from '@/modules/role/jobs/xo-role-users-add.job.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useRoleUsersAdd(rawRole: MaybeRefOrGetter<FrontXoRole>) {
  const role = toComputed(rawRole)

  const { t } = useI18n()

  const { users } = useXoUserCollection()

  const selectableUsers = computed(() => users.value.filter(user => !role.value.userIds.includes(user.id)))

  const usersToAdd = ref<FrontXoUser[]>([])

  const { run, isRunning: isAddingUsers } = useXoRoleUsersAddJob(() => [role.value], usersToAdd)

  const canAddUsers = computed(() => selectableUsers.value.length > 0)

  const { open } = useOverlay({
    component: () => import('@/modules/user/components/drawer/SelectUsersDrawer.vue'),
    events: {
      onConfirm: (selectedUsers: FrontXoUser[]) => selectedUsers,
      onCancel: true,
    },
  })

  async function addUsers() {
    const response = await open({ props: { users: selectableUsers.value, title: t('action:add-users') } })

    if (response.event !== 'onConfirm') {
      return
    }

    usersToAdd.value = response.payload

    run({ detached: true })
  }

  return { addUsers, canAddUsers, isAddingUsers }
}
