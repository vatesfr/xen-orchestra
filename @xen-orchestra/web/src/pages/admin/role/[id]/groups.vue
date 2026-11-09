<template>
  <RoleDetailLayout :role>
    <UiCard>
      <RoleGroupsTable :role :groups="roleGroups" :busy="!areGroupsReady" :error="hasGroupFetchError" />
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
  </RoleDetailLayout>
</template>

<script lang="ts" setup>
import GroupSidePanel from '@/modules/group/components/list/panel/GroupSidePanel.vue'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import RoleGroupsTable from '@/modules/role/components/detail/groups/RoleGroupsTable.vue'
import RoleDetailLayout from '@/modules/role/components/detail/RoleDetailLayout.vue'
import { useXoRoleGroupsRemoveJob } from '@/modules/role/jobs/xo-role-groups-remove.job.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import DetachButton from '@/shared/components/DetachButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { role } = defineProps<{
  role: FrontXoRole
}>()

const { useGetGroupsByIds, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const roleGroups = useGetGroupsByIds(() => role.groupIds)

const selectedGroup = useRouteQuery<FrontXoGroup | undefined>('id', {
  toData: id => roleGroups.value.find(group => group.id === id),
  toQuery: group => group?.id ?? '',
})

const {
  run: detachGroup,
  canRun: canDetachGroup,
  isRunning: isDetachingGroup,
  errorMessage: detachGroupErrorMessage,
} = useXoRoleGroupsRemoveJob(
  () => [role],
  () => (selectedGroup.value !== undefined ? [selectedGroup.value] : [])
)
</script>
