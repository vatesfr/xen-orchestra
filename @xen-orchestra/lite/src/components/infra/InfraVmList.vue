<template>
  <ul class="infra-vm-list">
    <li v-if="hasError" class="text-error typo h6-semi-bold">{{ $t('error-no-data') }}</li>
    <template v-else-if="!isReady">
      <InfraLoadingItem v-for="i in 3" :key="i" :icon="faDisplay" />
    </template>
    <InfraVmItem v-for="vm in vms" :key="vm.$ref" :vm-opaque-ref="vm.$ref" />
  </ul>
</template>

<script lang="ts" setup>
import InfraLoadingItem from '@/components/infra/InfraLoadingItem.vue'
import InfraVmItem from '@/components/infra/InfraVmItem.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  hostOpaqueRef?: XenApiHost['$ref']
}>()

const { isReady, recordsByHostRef, hasError } = useVmStore().subscribe()

const vms = computed(() => recordsByHostRef.value.get(props.hostOpaqueRef ?? ('OpaqueRef:NULL' as XenApiHost['$ref'])))
</script>

<style lang="postcss" scoped>
.text-error {
  padding-left: 3rem;
  color: var(--color-red-base);
}
</style>
