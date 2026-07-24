<template>
  <VtsSidePanel :has-selection="!!user" @close="emit('close')">
    <template v-if="user" #default>
      <UserInfosCard :user />
      <UserGroupsCard :user />
      <UserRolesCard />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import UserGroupsCard from '@/modules/user/components/list/panel/cards/UserGroupsCard.vue'
import UserInfosCard from '@/modules/user/components/list/panel/cards/UserInfosCard.vue'
import UserRolesCard from '@/modules/user/components/list/panel/cards/UserRolesCard.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  user?: FrontXoUser
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
