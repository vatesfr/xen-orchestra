<template>
  <VtsLoadingHero v-if="!isReady" type="page" />
  <VtsObjectNotFoundHero v-else-if="!vm" :id="route.params.id" type="page" />
  <RouterView v-else v-slot="{ Component }">
    <VmHeader v-if="uiStore.hasUi" :vm />
    <component :is="Component" :vm />
  </RouterView>
</template>

<script lang="ts" setup>
import VmHeader from '@/components/vm/VmHeader.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute<'/vm/[id]'>()

const router = useRouter()

router.beforeEach(async to => {
  if (to.name === '/vm/[id]') {
    return `/vm/${route.params.id}/console`
  }
})

const { isReady, get: getVm } = useVmStore().subscribe()
const uiStore = useUiStore()

const vm = computed(() => getVm(route.params.id as XoVm['id']))
</script>
