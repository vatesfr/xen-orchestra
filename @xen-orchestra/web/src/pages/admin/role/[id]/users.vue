<template>
  <RoleDetailLayout :role>
    <UiCard>
      <RoleUsersTable :role :users="roleUsers" :busy="!areRoleUsersReady" :error="hasRoleUserFetchError" />
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
  </RoleDetailLayout>
</template>

<script lang="ts" setup>
import RoleDetailLayout from '@/modules/role/components/detail/RoleDetailLayout.vue'
import RoleUsersTable from '@/modules/role/components/detail/users/RoleUsersTable.vue'
import { type RoleUser, useXoRoleUsers } from '@/modules/role/composables/use-xo-role-users.composable.ts'
import { useXoRoleUsersRemoveJob } from '@/modules/role/jobs/xo-role-users-remove.job.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import UserSidePanel from '@/modules/user/components/list/panel/UserSidePanel.vue'
import DetachButton from '@/shared/components/DetachButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { role } = defineProps<{
  role: FrontXoRole
}>()

const { roleUsers, areRoleUsersReady, hasRoleUserFetchError } = useXoRoleUsers(() => role)

const selectedUser = useRouteQuery<RoleUser | undefined>('id', {
  toData: id => roleUsers.value.find(user => user.id === id),
  toQuery: user => user?.id ?? '',
})

const {
  run: detachUser,
  canRun: canDetachUser,
  isRunning: isDetachingUser,
  errorMessage: detachUserErrorMessage,
} = useXoRoleUsersRemoveJob(
  () => [role],
  () => (selectedUser.value !== undefined ? [selectedUser.value] : [])
)
</script>
