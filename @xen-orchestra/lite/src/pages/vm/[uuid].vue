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
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

import { useUiStore } from '@core/stores/ui.store'
import type { XenApiVm } from '@vates/types'
import { whenever } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

useDefaultTab('/vm/[uuid]', 'dashboard')

const route = useRoute<'/vm/[uuid]'>()
const uiStore = useUiStore()
const { getByUuid, hasUuid, isReady } = useVmStore().subscribe()

const vm = computed(() => getByUuid(route.params.uuid as XenApiVm['uuid']))

whenever(vm, vm => (uiStore.currentHostOpaqueRef = vm.resident_on))

usePageTitleStore().setObject(vm)
</script>
