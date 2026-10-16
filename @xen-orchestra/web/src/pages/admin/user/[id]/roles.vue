<template>
  <UserDetailLayout :user>
    <UiCard>
      <UserRolesTable :user :roles="userRoles" :busy="!areUserRolesReady" :error="hasUserRoleFetchError" />
    </UiCard>
    <template #panel>
      <RoleSidePanel :role="selectedRole" @close="selectedRole = undefined">
        <template #actions>
          <DetachButton
            :disabled="!canDetachRole"
            :busy="isDetachingRole"
            :tooltip="detachRoleErrorMessage ?? false"
            @click="detachRole({ detached: true })"
          />
        </template>
      </RoleSidePanel>
    </template>
  </UserDetailLayout>
</template>

<script lang="ts" setup>
import RoleSidePanel from '@/modules/role/components/list/panel/RoleSidePanel.vue'
import { useXoRoleUsersRemoveJob } from '@/modules/role/jobs/xo-role-users-remove.job.ts'
import UserRolesTable from '@/modules/user/components/detail/roles/UserRolesTable.vue'
import UserDetailLayout from '@/modules/user/components/detail/UserDetailLayout.vue'
import { type UserRole, useXoUserRoles } from '@/modules/user/composables/use-xo-user-roles.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import DetachButton from '@/shared/components/DetachButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { userRoles, areUserRolesReady, hasUserRoleFetchError } = useXoUserRoles(() => user)

const selectedRole = useRouteQuery<UserRole | undefined>('id', {
  toData: id => userRoles.value.find(role => role.id === id),
  toQuery: role => role?.id ?? '',
})

const {
  run: detachRole,
  canRun: canDetachRole,
  isRunning: isDetachingRole,
  errorMessage: detachRoleErrorMessage,
} = useXoRoleUsersRemoveJob(
  () => (selectedRole.value !== undefined ? [selectedRole.value] : []),
  () => [user]
)
</script>
