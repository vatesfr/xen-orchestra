<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiAlert v-if="!alertDismissed" class="alert" accent="info" close @close="alertDismissed = true">
        {{ t('alert-user-roles') }}
      </UiAlert>
      <UiCard>
        <UsersTable :users />
      </UiCard>
    </div>

    <UserSidePanel :user="selectedUser" @close="selectedUser = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import UserSidePanel from '@/modules/user/components/list/panel/UserSidePanel.vue'
import UsersTable from '@/modules/user/components/list/UsersTable.vue'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  users: FrontXoUser[]
}>()

const { t } = useI18n()

const { getUserById } = useXoUserCollection()

const alertDismissed = ref(false)

const selectedUser = useRouteQuery<FrontXoUser | undefined>('id', {
  toData: id => getUserById(id as FrontXoUser['id']),
  toQuery: user => user?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  gap: 0.8rem;
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
}
</style>
