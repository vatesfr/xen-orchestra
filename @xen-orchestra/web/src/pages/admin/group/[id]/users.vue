<template>
  <GroupDetailLayout :group>
    <UiCard>
      <GroupUsersTable :group :users="groupUsers" :busy="!areUsersReady" :error="hasUserFetchError" />
    </UiCard>
    <template #panel>
      <UserSidePanel :user="selectedUser" @close="selectedUser = undefined">
        <template #actions>
          <DetachButton
            :disabled="!canDetachUser"
            :busy="isDetachingUser"
            :tooltip="detachUserErrorMessage ?? false"
            @click="detachUser({ detached: true })"
          />
        </template>
      </UserSidePanel>
    </template>
  </GroupDetailLayout>
</template>

<script lang="ts" setup>
import GroupDetailLayout from '@/modules/group/components/detail/GroupDetailLayout.vue'
import GroupUsersTable from '@/modules/group/components/detail/users/GroupUsersTable.vue'
import { useXoGroupUsersRemoveJob } from '@/modules/group/jobs/xo-group-users-remove.job.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import UserSidePanel from '@/modules/user/components/list/panel/UserSidePanel.vue'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import DetachButton from '@/shared/components/DetachButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { group } = defineProps<{
  group: FrontXoGroup
}>()

const { useGetUsersByIds, areUsersReady, hasUserFetchError } = useXoUserCollection()

const groupUsers = useGetUsersByIds(() => group.users)

const selectedUser = useRouteQuery<FrontXoUser | undefined>('id', {
  toData: id => groupUsers.value.find(user => user.id === id),
  toQuery: user => user?.id ?? '',
})

const {
  run: detachUser,
  canRun: canDetachUser,
  isRunning: isDetachingUser,
  errorMessage: detachUserErrorMessage,
} = useXoGroupUsersRemoveJob(
  () => [group],
  () => (selectedUser.value !== undefined ? [selectedUser.value] : [])
)
</script>
