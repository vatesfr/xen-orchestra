<template>
  <VtsSidePanel :has-selection="privilege !== undefined" @close="emit('close')">
    <template v-if="privilege" #default>
      <PrivilegeInfosCard :privilege :number />
      <PrivilegeScopeCard :privilege />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import PrivilegeInfosCard from '@/modules/role/components/privilege/panel/cards/PrivilegeInfosCard.vue'
import PrivilegeScopeCard from '@/modules/role/components/privilege/panel/cards/PrivilegeScopeCard.vue'
import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  privilege?: FrontXoPrivilege
  number: number
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
