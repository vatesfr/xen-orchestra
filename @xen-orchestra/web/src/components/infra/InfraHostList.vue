<template>
  <InfraHostItem v-for="host in hosts" :key="host.id" :host />
</template>

<script lang="ts" setup>
import InfraHostItem from '@/components/infra/InfraHostItem.vue'
import type { Host } from '@/types/host.type'
import type { Vm } from '@/types/vm.type'
import type { Branch } from '@core/composables/tree/branch'
import type { Leaf } from '@core/composables/tree/leaf'

defineProps<{
  hosts: Branch<Host, Leaf<Vm>>[]
}>()
</script>
