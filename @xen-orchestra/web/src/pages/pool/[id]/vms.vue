<template>
  <UiCard class="vms">
    <VmsTable />
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { usePoolVmsTable } from '@core/tables/use-pool-vms-table'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { areVmsReady, hasVmFetchError, vmsByPool } = useXoVmCollection()

const vms = computed(() => vmsByPool.value.get(pool.id) ?? [])

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
</style>
