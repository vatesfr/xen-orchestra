<template>
  <VtsLoadingHero v-if="!areVmsReady" type="page" />
  <VtsObjectNotFoundHero v-else-if="!vm" :id="route.params.id" type="page" />
  <RouterView v-else v-slot="{ Component }">
    <VmHeader v-if="uiStore.hasUi" :vm />
    <component :is="Component" :vm />
  </RouterView>
</template>

<script lang="ts" setup>
import VmHeader from '@/components/vm/VmHeader.vue'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { useRoute } from 'vue-router'

useDefaultTab('/vm/[id]', 'dashboard')

const route = useRoute<'/vm/[id]'>()

const { areVmsReady, useGetVmById } = useXoVmCollection()
const uiStore = useUiStore()

const vm = useGetVmById(() => route.params.id as XoVm['id'])
</script>
