<template>
  <ObjectNotFoundWrapper :is-ready="isReady" :uuid-checker="hasUuid">
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from '@/components/ObjectNotFoundWrapper.vue'
import { useHostCollection } from '@/stores/xen-api/host.store'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useUiStore } from '@/stores/ui.store'
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { hasUuid, isReady, getByUuid } = useHostCollection()
const route = useRoute()
const uiStore = useUiStore()

const currentHost = computed(() => getByUuid(route.params.uuid as XenApiHost['uuid']))

watchEffect(() => {
  uiStore.currentHostOpaqueRef = currentHost.value?.$ref
})

usePageTitleStore().setObject(currentHost)
</script>
