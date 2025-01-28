<template>
  <VtsLoadingHero v-if="!isReady" type="page" />
  <VtsObjectNotFoundHero v-else-if="!host" :id="route.params.id" type="page" />
  <RouterView v-else v-slot="{ Component }">
    <HostHeader v-if="uiStore.hasUi" :host />
    <component :is="Component" :host />
  </RouterView>
</template>

<script lang="ts" setup>
import HostHeader from '@/components/host/HostHeader.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoHost } from '@/types/xo/host.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const route = useRoute<'/host/[id]'>()

const { isReady, get } = useHostStore().subscribe()
const uiStore = useUiStore()

const host = computed(() => get(route.params.id as XoHost['id']))
</script>
