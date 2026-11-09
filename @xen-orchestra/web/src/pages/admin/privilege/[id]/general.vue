<template>
  <PrivilegeDetailLayout :privilege>
    <PrivilegeDetailsCard :privilege />
  </PrivilegeDetailLayout>
</template>

<script lang="ts" setup>
import PrivilegeDetailLayout from '@/modules/role/components/privilege/detail/PrivilegeDetailLayout.vue'
import PrivilegeDetailsCard from '@/modules/role/components/privilege/detail/PrivilegeDetailsCard.vue'
import type { XoAclBasePrivilege } from '@vates/types'

defineProps<{
  privilege: XoAclBasePrivilege
}>()
</script>
