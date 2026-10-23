import { useXoGroupUsersAddJob } from '@/modules/group/jobs/xo-group-users-add.job.ts'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useUserGroupsAdd(rawUser: MaybeRefOrGetter<FrontXoUser>) {
  const user = toComputed(rawUser)

  const { t } = useI18n()

  const { groups } = useXoGroupCollection()

  const selectableGroups = computed(() =>
    groups.value.filter(group => group.provider === undefined && !user.value.groups.includes(group.id))
  )

  const groupsToAdd = ref<FrontXoGroup[]>([])

  const { run, isRunning: isAddingGroups } = useXoGroupUsersAddJob(groupsToAdd, () => [user.value])

  const canAddGroups = computed(() => selectableGroups.value.length > 0)

  const { open } = useOverlay({
    component: () => import('@/modules/group/components/drawer/SelectGroupsDrawer.vue'),
    events: {
      onConfirm: (selectedGroups: FrontXoGroup[]) => selectedGroups,
      onCancel: true,
    },
  })

  async function addGroups() {
    const response = await open({ props: { groups: selectableGroups.value, title: t('action:add-groups') } })

    if (response.event !== 'onConfirm') {
      return
    }

    groupsToAdd.value = response.payload

    run({ detached: true })
  }

  return { addGroups, canAddGroups, isAddingGroups }
}
