<template>
  <LoadingHero v-if="!isReady" type="page" />
  <ObjectNotFoundHero v-else-if="!vm" :id="route.params.id" />
  <RouterView v-else v-slot="{ Component }">
    <VmHeader :vm />
    <component :is="Component" :vm />
  </RouterView>
</template>

<script lang="ts" setup>
import VmHeader from '@/components/vm/VmHeader.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { RecordId } from '@/types/xo-object.type'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import ObjectNotFoundHero from '@core/components/state-hero/ObjectNotFoundHero.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const route = useRoute<'/vm/[id]'>()

const { isReady, get: getVm } = useVmStore().subscribe()

const vm = computed(() => getVm(route.params.id as RecordId<'VM'>))
</script>
