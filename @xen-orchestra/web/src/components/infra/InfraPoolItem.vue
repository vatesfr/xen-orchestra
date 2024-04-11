<template>
  <TreeItem>
    <TreeItemLabel :icon="faCity" route="foo">{{ pool.name_label }}</TreeItemLabel>
    <template #sublist>
      <InfraHostList :pool-id="pool.id" />
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import InfraHostList from '@/components/infra/InfraHostList.vue'
import type { Pool } from '@/stores/xo-rest-api/create-xo-store-config'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  pool: Pool
}>()
</script>
