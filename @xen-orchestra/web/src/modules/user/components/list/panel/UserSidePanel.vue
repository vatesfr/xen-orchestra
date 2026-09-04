<template>
  <VtsSidePanel :has-selection="!!user" @close="emit('close')">
    <template v-if="user" #actions>
      <VtsDeleteButton
        :disabled="!canDeleteUsers"
        :busy="isDeletingUsers"
        :tooltip="deleteUsersErrorMessage ?? false"
        @click="deleteUsers()"
      />
    </template>
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
import { useUserDelete } from '@/modules/user/composables/use-user-delete.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { user } = defineProps<{
  user?: FrontXoUser
}>()

const emit = defineEmits<{
  close: []
}>()

const { deleteUsers, canDeleteUsers, isDeletingUsers, deleteUsersErrorMessage } = useUserDelete(() =>
  user !== undefined ? [user] : []
)
</script>
