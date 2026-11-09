<template>
  <UserDetailLayout :user>
    <UiCard>
      <UserGroupsTable :user :groups="userGroups" :busy="!areGroupsReady" :error="hasGroupFetchError" />
    </UiCard>
    <template #panel>
      <GroupSidePanel :group="selectedGroup" @close="selectedGroup = undefined">
        <template #actions>
          <DetachButton
            :disabled="!canDetachGroup"
            :busy="isDetachingGroup"
            :tooltip="detachGroupErrorMessage ?? false"
            @click="detachGroup({ detached: true })"
          />
        </template>
      </GroupSidePanel>
    </template>
  </UserDetailLayout>
</template>

<script lang="ts" setup>
import GroupSidePanel from '@/modules/group/components/list/panel/GroupSidePanel.vue'
import { useXoGroupUsersRemoveJob } from '@/modules/group/jobs/xo-group-users-remove.job.ts'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import UserGroupsTable from '@/modules/user/components/detail/groups/UserGroupsTable.vue'
import UserDetailLayout from '@/modules/user/components/detail/UserDetailLayout.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import DetachButton from '@/shared/components/DetachButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { useGetGroupsByIds, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const userGroups = useGetGroupsByIds(() => user.groups)

const selectedGroup = useRouteQuery<FrontXoGroup | undefined>('id', {
  toData: id => userGroups.value.find(group => group.id === id),
  toQuery: group => group?.id ?? '',
})

const {
  run: detachGroup,
  canRun: canDetachGroup,
  isRunning: isDetachingGroup,
  errorMessage: detachGroupErrorMessage,
} = useXoGroupUsersRemoveJob(
  () => (selectedGroup.value !== undefined ? [selectedGroup.value] : []),
  () => [user]
)
</script>
