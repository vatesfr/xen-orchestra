<template>
  <VtsStateHero v-if="!areNetworksReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!network" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <NetworkHeader v-if="uiStore.hasUi" :network />
    <component :is="Component" :network />
  </RouterView>
</template>

<script lang="ts" setup>
import NetworkHeader from '@/modules/network/components/NetworkHeader.vue'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/network/[id]', 'general')

const route = useRoute<'/network/[id]'>()

const { t } = useI18n()

const uiStore = useUiStore()

const { areNetworksReady, useGetNetworkById } = useXoNetworkCollection()

const network = useGetNetworkById(() => route.params.id as FrontXoNetwork['id'])
</script>
