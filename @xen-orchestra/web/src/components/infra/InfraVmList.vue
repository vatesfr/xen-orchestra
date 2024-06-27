<template>
  <InfraVmItem v-for="vm in vms" :key="vm.id" :vm />
</template>

<script lang="ts" setup>
import InfraVmItem from '@/components/infra/InfraVmItem.vue'
import type { Vm } from '@/types/vm.type'
import type { Leaf } from '@core/composables/tree/leaf'

defineProps<{
  vms: Leaf<Vm>[]
}>()
</script>
