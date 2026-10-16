<template>
  <VtsStateHero v-if="!isPrivilegeReady || !areRolesReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!privilege || !role" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <PrivilegeHeader v-if="uiStore.hasUi" :role :privilege />
    <component :is="Component" :privilege />
  </RouterView>
</template>

<script lang="ts" setup>
import PrivilegeHeader from '@/modules/role/components/privilege/detail/PrivilegeHeader.vue'
import { useXoPrivilegeResource } from '@/modules/role/remote-resources/use-xo-privilege.ts'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/admin/privilege/[id]'>()

useDefaultTab('/admin/privilege/[id]', 'general')

const uiStore = useUiStore()

const { t } = useI18n()

const { privilege, isPrivilegeReady } = useXoPrivilegeResource({}, () => route.params.id)

const { useGetRoleById, areRolesReady } = useXoRoleCollection()

const role = useGetRoleById(() => privilege.value?.roleId)
</script>
