<template>
  <LoadingHero v-if="!isReady" type="page" />
  <ObjectNotFoundHero v-else-if="!host" :id="route.params.id" />
  <RouterView v-else v-slot="{ Component }">
    <HostHeader :host />
    <component :is="Component" :host />
  </RouterView>
</template>

<script setup lang="ts">
import HostHeader from '@/components/host/HostHeader.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { RecordId } from '@/types/xo-object.type'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import ObjectNotFoundHero from '@core/components/state-hero/ObjectNotFoundHero.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const route = useRoute<'/host/[id]'>()

const { isReady, get } = useHostStore().subscribe()

const host = computed(() => get(route.params.id as RecordId<'host'>))
</script>
