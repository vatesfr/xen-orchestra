<template>
  <VtsStateHero v-if="!areRolesReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!role" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <RoleHeader v-if="uiStore.hasUi" :role />
    <component :is="Component" :role />
  </RouterView>
</template>

<script lang="ts" setup>
import RoleHeader from '@/modules/role/components/detail/RoleHeader.vue'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/admin/role/[id]'>()

useDefaultTab('/admin/role/[id]', 'general')

const uiStore = useUiStore()

const { t } = useI18n()

const { useGetRoleById, areRolesReady } = useXoRoleCollection()

const role = useGetRoleById(() => route.params.id as FrontXoRole['id'])
</script>
