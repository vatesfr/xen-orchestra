<template>
  <TreeList v-if="isReady">
    <InfraHostItem v-for="host in hosts" :key="host.id" :host />
  </TreeList>
</template>

<script lang="ts" setup>
import InfraHostItem from '@/components/infra/InfraHostItem.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { RecordId } from '@/types/xo-object.type'
import TreeList from '@core/components/tree/TreeList.vue'
import { computed } from 'vue'

const props = defineProps<{
  poolId: RecordId<'pool'>
}>()

const { hostsByPool, isReady } = useHostStore().subscribe()

const hosts = computed(() => hostsByPool.value.get(props.poolId))
</script>
