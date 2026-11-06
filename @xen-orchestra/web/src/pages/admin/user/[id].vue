<template>
  <VtsStateHero v-if="!areUsersReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!user" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <UserHeader v-if="uiStore.hasUi" :user />
    <component :is="Component" :user />
  </RouterView>
</template>

<script lang="ts" setup>
import UserHeader from '@/modules/user/components/detail/UserHeader.vue'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/admin/user/[id]'>()

useDefaultTab('/admin/user/[id]', 'general')

const uiStore = useUiStore()

const { t } = useI18n()

const { useGetUserById, areUsersReady } = useXoUserCollection()

const user = useGetUserById(() => route.params.id as FrontXoUser['id'])
</script>
