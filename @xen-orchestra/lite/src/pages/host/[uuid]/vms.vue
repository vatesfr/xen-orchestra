<template>
  <VmsPageContent :vms :busy="!isReady" :error="hasError" />
</template>

<script lang="ts" setup>
import VmsPageContent from '@/components/vm/VmsPageContent.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { isReady: isVmReady, hasError: hasVmError, recordsByHostRef } = useVmStore().subscribe()

const { isReady: isHostReady, hasError: hasHostError, getByUuid } = useHostStore().subscribe()

const isReady = logicAnd(isVmReady, isHostReady)

const hasError = logicOr(hasVmError, hasHostError)

const route = useRoute<'/host/[uuid]/vms'>()

const host = computed(() => getByUuid(route.params.uuid as XenApiHost['uuid']))

const vms = computed(() => (host.value ? (recordsByHostRef.value.get(host.value?.$ref) ?? []) : []))
</script>
