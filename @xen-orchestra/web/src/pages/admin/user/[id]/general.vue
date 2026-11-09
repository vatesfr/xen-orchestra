<template>
  <UserDetailLayout :user>
    <UserDetailsCard :user />
  </UserDetailLayout>
</template>

<script lang="ts" setup>
import UserDetailLayout from '@/modules/user/components/detail/UserDetailLayout.vue'
import UserDetailsCard from '@/modules/user/components/detail/UserDetailsCard.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'

defineProps<{
  user: FrontXoUser
}>()
</script>
