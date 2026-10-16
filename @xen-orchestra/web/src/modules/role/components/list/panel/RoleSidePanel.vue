<template>
  <VtsSidePanel :has-selection="role !== undefined" @close="emit('close')">
    <template v-if="role" #actions>
      <VtsDeleteButton
        :disabled="!canDeleteRoles"
        :busy="isDeletingRoles"
        :tooltip="deleteRolesErrorMessage ?? false"
        @click="deleteRoles()"
      />
    </template>
    <template v-if="role" #default>
      <RoleInfosCard :role />
      <RoleUsersCard :role />
      <RoleGroupsCard :role />
      <RolePrivilegesCard :role />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import RoleGroupsCard from '@/modules/role/components/list/panel/cards/RoleGroupsCard.vue'
import RoleInfosCard from '@/modules/role/components/list/panel/cards/RoleInfosCard.vue'
import RolePrivilegesCard from '@/modules/role/components/list/panel/cards/RolePrivilegesCard.vue'
import RoleUsersCard from '@/modules/role/components/list/panel/cards/RoleUsersCard.vue'
import { useRoleDelete } from '@/modules/role/composables/use-role-delete.composable.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { role } = defineProps<{
  role?: FrontXoRole
}>()

const emit = defineEmits<{
  close: []
}>()

const { deleteRoles, canDeleteRoles, isDeletingRoles, deleteRolesErrorMessage } = useRoleDelete(() =>
  role !== undefined ? [role] : []
)
</script>
