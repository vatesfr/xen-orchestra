<template>
  <TreeList v-if="isReady">
    <InfraVmItem v-for="vm in vms" :key="vm.id" :vm />
  </TreeList>
</template>

<script lang="ts" setup>
import InfraVmItem from '@/components/infra/InfraVmItem.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import TreeList from '@core/components/tree/TreeList.vue'
import { computed } from 'vue'

const props = defineProps<{
  hostId: string
}>()

const { isReady, vmsByHost } = useVmStore().subscribe()

const vms = computed(() => vmsByHost.value.get(props.hostId))
</script>
