<template>
  <TreeList v-if="isReady">
    <InfraVmItem v-for="vm in vms" :key="vm.id" :vm />
  </TreeList>
</template>

<script lang="ts" setup generic="TFor extends 'host' | 'pool'">
import InfraVmItem from '@/components/infra/InfraVmItem.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { RecordId } from '@/types/xo-object.type'
import TreeList from '@core/components/tree/TreeList.vue'
import { computed } from 'vue'

const props = defineProps<{
  for: TFor
  containerId: RecordId<TFor>
}>()

const { isReady, vmsByHost, hostLessVmsByPool } = useVmStore().subscribe()

const vms = computed(() => {
  if (props.for === 'pool') {
    return hostLessVmsByPool.value.get(props.containerId as RecordId<'pool'>) ?? []
  }

  return vmsByHost.value.get(props.containerId as RecordId<'host'>) ?? []
})
</script>
