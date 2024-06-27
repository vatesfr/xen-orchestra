<template>
  <TreeList class="infra-pool-list">
    <InfraPoolItem v-for="pool in pools" :key="pool.id" :pool />
  </TreeList>
</template>

<script lang="ts" setup>
import InfraPoolItem from '@/components/infra/InfraPoolItem.vue'
import type { Host } from '@/types/host.type'
import type { Pool } from '@/types/pool.type'
import type { Vm } from '@/types/vm.type'
import type { Branch } from '@core/composables/tree/branch'
import type { Leaf } from '@core/composables/tree/leaf'
import TreeList from '@core/components/tree/TreeList.vue'

defineProps<{
  pools: Branch<Pool, Branch<Host, Leaf<Vm>, 'host'> | Leaf<Vm, 'vm'>>[]
}>()
</script>

<style lang="postcss" scoped>
.infra-pool-list {
  background-color: var(--background-color-primary);
  padding: 0.8rem;
  min-height: 100%;
}
</style>
