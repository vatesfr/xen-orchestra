<template>
  <UiCard class="vms">
    <VmsTable />
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoHost } from '@/types/xo/host.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { usePoolVmsTable } from '@core/tables/use-pool-vms-table'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XoHost
}>()

const { areVmsReady, vmsByHost, hasVmFetchError } = useXoVmCollection()

const vms = computed(() => vmsByHost.value.get(host.id) ?? [])

const VmsTable = usePoolVmsTable(vms, {
  ready: areVmsReady,
  error: hasVmFetchError,
  empty: computed(() => vms.value.length === 0),
})
</script>

<style lang="postcss" scoped>
.vms {
  margin: 1rem;
  gap: 0.8rem;
}

.pagination {
  margin-left: auto;
}
</style>
