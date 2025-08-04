<template>
  <VtsLoadingHero v-if="!isHostCollectionReady" type="page" />
  <VtsObjectNotFoundHero v-else-if="!host" :id="route.params.id" type="page" />
  <RouterView v-else v-slot="{ Component }">
    <HostHeader v-if="uiStore.hasUi" :host />
    <component :is="Component" :host />
  </RouterView>
</template>

<script lang="ts" setup>
import HostHeader from '@/components/host/HostHeader.vue'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoHost } from '@/types/xo/host.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { useRoute } from 'vue-router/auto'

useDefaultTab('/host/[id]', 'dashboard')

const route = useRoute<'/host/[id]'>()

const { isHostCollectionReady, useGetHostById } = useXoHostCollection()
const uiStore = useUiStore()

const host = useGetHostById(() => route.params.id as XoHost['id'])
</script>
