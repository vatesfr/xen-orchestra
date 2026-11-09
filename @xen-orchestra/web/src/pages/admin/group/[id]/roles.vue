<template>
  <GroupDetailLayout :group>
    <UiCard>
      <GroupRolesTable :group :roles="groupRoles" :busy="!areRolesReady" :error="hasRoleFetchError" />
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
  </GroupDetailLayout>
</template>

<script lang="ts" setup>
import GroupDetailLayout from '@/modules/group/components/detail/GroupDetailLayout.vue'
import GroupRolesTable from '@/modules/group/components/detail/roles/GroupRolesTable.vue'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import RoleSidePanel from '@/modules/role/components/list/panel/RoleSidePanel.vue'
import { useXoRoleGroupsRemoveJob } from '@/modules/role/jobs/xo-role-groups-remove.job.ts'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import DetachButton from '@/shared/components/DetachButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'

const { group } = defineProps<{
  group: FrontXoGroup
}>()

const { roles, areRolesReady, hasRoleFetchError } = useXoRoleCollection()

const groupRoles = computed(() => roles.value.filter(role => role.groupIds.includes(group.id)))

const selectedRole = useRouteQuery<FrontXoRole | undefined>('id', {
  toData: id => groupRoles.value.find(role => role.id === id),
  toQuery: role => role?.id ?? '',
})

const {
  run: detachRole,
  canRun: canDetachRole,
  isRunning: isDetachingRole,
  errorMessage: detachRoleErrorMessage,
} = useXoRoleGroupsRemoveJob(
  () => (selectedRole.value !== undefined ? [selectedRole.value] : []),
  () => [group]
)
</script>
