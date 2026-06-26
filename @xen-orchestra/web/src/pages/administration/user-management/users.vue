<template>
  <div class="users" :class="{ mobile: uiStore.isSmall }">
    <div class="center">
      <UiAlert v-if="!alertDismissed" class="alert" accent="info" close @close="alertDismissed = true">
        {{ t('alert-user-roles') }}
      </UiAlert>
      <UiCard class="container">
        <UsersTable :users />
      </UiCard>
    </div>

    <UserSidePanel v-if="selectedUser" :user="selectedUser" @close="selectedUser = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import UserSidePanel from '@/modules/user/components/list/panel/UserSidePanel.vue'
import UsersTable from '@/modules/user/components/list/UsersTable.vue'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { users } = defineProps<{
  users: FrontXoUser[]
}>()

const { t } = useI18n()

const { getUserById } = useXoUserCollection()

const uiStore = useUiStore()

const alertDismissed = ref(false)

const selectedUser = useRouteQuery<FrontXoUser | undefined>('id', {
  toData: id => getUserById(id as FrontXoUser['id']),
  toQuery: user => user?.id ?? '',
})
</script>

<style scoped lang="postcss">
.users {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .center {
    display: flex;
    flex-direction: column;

    .alert {
      margin: 0.8rem 0.8rem 0 0.8rem;
    }

    .container {
      height: fit-content;
      margin: 0.8rem;
      gap: 4rem;
    }
  }
}
</style>
