<template>
  <TreeItem>
    <TreeItemLabel :icon="faCity" :route="`/pool/${pool.id}`">{{ pool.name_label }}</TreeItemLabel>
    <template #sublist>
      <InfraHostList :pool-id="pool.id" />
      <InfraVmList :container-id="pool.id" for="pool" />
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import InfraHostList from '@/components/infra/InfraHostList.vue'
import InfraVmList from '@/components/infra/InfraVmList.vue'
import type { Pool } from '@/types/pool.type'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  pool: Pool
}>()
</script>
