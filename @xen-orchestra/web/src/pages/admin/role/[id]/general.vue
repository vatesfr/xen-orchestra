<template>
  <RoleDetailLayout :role>
    <RoleDetailsCard :role />
  </RoleDetailLayout>
</template>

<script lang="ts" setup>
import RoleDetailLayout from '@/modules/role/components/detail/RoleDetailLayout.vue'
import RoleDetailsCard from '@/modules/role/components/detail/RoleDetailsCard.vue'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'

defineProps<{
  role: FrontXoRole
}>()
</script>
