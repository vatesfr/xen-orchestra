<template>
  <TreeItemError v-if="hasError">{{ $t('error-no-data') }}</TreeItemError>
  <template v-else-if="!isReady">
    <TreeLoadingItem v-for="i in 3" :key="i" :icon="faDisplay" />
  </template>
  <InfraVmItem v-for="vm in vms" :key="vm.$ref" :vm-opaque-ref="vm.$ref" />
</template>

<script lang="ts" setup>
import InfraVmItem from '@/components/infra/InfraVmItem.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import TreeItemError from '@core/components/tree/TreeItemError.vue'
import TreeLoadingItem from '@core/components/tree/TreeLoadingItem.vue'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  hostOpaqueRef?: XenApiHost['$ref']
}>()

const { isReady, recordsByHostRef, hasError } = useVmStore().subscribe()

const vms = computed(() => recordsByHostRef.value.get(props.hostOpaqueRef ?? ('OpaqueRef:NULL' as XenApiHost['$ref'])))
</script>
