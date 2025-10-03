<template>
  <UiCard class="hosts">
    <HostsTable />
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { usePoolHostsTable } from '@core/tables/use-pool-hosts-table'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { areHostsReady, hasHostFetchError, hostsByPool } = useXoHostCollection()

const hosts = computed(() => hostsByPool.value.get(pool.id) ?? [])

const HostsTable = usePoolHostsTable(hosts, {
  ready: areHostsReady,
  error: hasHostFetchError,
  empty: computed(() => hosts.value.length === 0),
})
</script>

<style lang="postcss" scoped>
.hosts {
  margin: 1rem;
  gap: 0.8rem;
}
</style>
