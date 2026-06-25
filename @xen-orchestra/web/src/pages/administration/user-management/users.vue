<template>
  <div class="vdis" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <UsersTable :users />
    </UiCard>
    <UserSidePanel v-if="selectedUser" :user="selectedUser" @close="selectedUser = undefined" />
  </div>
</template>

<script setup lang="ts">
import UserSidePanel from '@/modules/user/components/list/panel/UserSidePanel.vue'
import UsersTable from '@/modules/user/components/list/UsersTable.vue'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'

const { users } = defineProps<{
  users: FrontXoUser[]
}>()

const { getUserById } = useXoUserCollection()

const uiStore = useUiStore()

const selectedUser = useRouteQuery<FrontXoUser | undefined>('id', {
  toData: id => getUserById(id as FrontXoUser['id']),
  toQuery: user => user?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vdis {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}

/* This selector can't be nested,
* as the links in MenuItem are teleported and are not children of .vdis element.
* This selector extends the clickable area of the links for better accessibility
*/
.add-vdi-link {
  height: 100%;
  width: 100%;
}
</style>
