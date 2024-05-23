<template>
  <ObjectNotFoundWrapper :is-ready="isReady" :uuid-checker="hasUuid">
    <template v-if="uiStore.hasUi">
      <VmHeader />
      <VmTabBar :uuid="vm!.uuid" />
    </template>
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from '@/components/ObjectNotFoundWrapper.vue'
import VmHeader from '@/components/vm/VmHeader.vue'
import VmTabBar from '@/components/vm/VmTabBar.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useUiStore } from '@core/stores/ui.store'
import { whenever } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { getByUuid, hasUuid, isReady } = useVmStore().subscribe()
const uiStore = useUiStore()
const vm = computed(() => getByUuid(route.params.uuid as XenApiVm['uuid']))
whenever(vm, vm => (uiStore.currentHostOpaqueRef = vm.resident_on))
usePageTitleStore().setObject(vm)
</script>
