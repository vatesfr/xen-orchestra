<template>
  <ObjectNotFoundWrapper :is-ready="isReady" :uuid-checker="hasUuid">
    <template v-if="uiStore.hasUi">
      <HostHeader />
      <HostTabBar :uuid="currentHost!.uuid" />
    </template>
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from '@/components/ObjectNotFoundWrapper.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import HostHeader from '@/views/host/HostHeader.vue'
import HostTabBar from '@/views/host/HostTabBar.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { hasUuid, isReady, getByUuid } = useHostStore().subscribe()
const route = useRoute()
const uiStore = useUiStore()

const currentHost = computed(() => getByUuid(route.params.uuid as XenApiHost['uuid']))

watchEffect(() => {
  uiStore.currentHostOpaqueRef = currentHost.value?.$ref
})

usePageTitleStore().setObject(currentHost)
</script>
