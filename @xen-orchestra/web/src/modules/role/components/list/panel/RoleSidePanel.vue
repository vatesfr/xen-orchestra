<template>
  <VtsSidePanel :has-selection="role !== undefined" @close="emit('close')">
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
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { role } = defineProps<{
  role?: FrontXoRole
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
