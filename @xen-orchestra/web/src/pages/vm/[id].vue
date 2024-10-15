<template>
  <VtsLoadingHero v-if="!isReady" type="page" />
  <VtsObjectNotFoundHero v-else-if="!vm" :id="route.params.id" />
  <RouterView v-else v-slot="{ Component }">
    <VmHeader :vm />
    <component :is="Component" :vm />
  </RouterView>
</template>

<script lang="ts" setup>
import VmHeader from '@/components/vm/VmHeader.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const route = useRoute<'/vm/[id]'>()

const { isReady, get: getVm } = useVmStore().subscribe()

const vm = computed(() => getVm(route.params.id as XoVm['id']))
</script>
