<template>
  <V2vVmSourceCard :vm="vm.vm" :host-name />
  <V2vVmChecksCard :checks />
  <V2vDestinationMappingCard :pool-name :disk-rows :nic-rows :sr-options :network-options :loading="!areOffersReady" />
  <V2vVmOptionsCard :keep-mac :template :template-options :tags />
</template>

<script lang="ts" setup>
import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import V2vVmChecksCard from '@/modules/v2v/components/mapping/V2vVmChecksCard.vue'
import V2vVmSourceCard from '@/modules/v2v/components/mapping/V2vVmSourceCard.vue'
import V2vVmOptionsCard from '@/modules/v2v/components/panel/V2vVmOptionsCard.vue'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import type { V2vNewMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import { useV2vVmMapping } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'

const { vm } = defineProps<{
  vm: V2vNewMappingStepVm
}>()

const {
  poolName,
  hostName,
  checks,
  diskRows,
  nicRows,
  template,
  srOptions,
  networkOptions,
  templateOptions,
  areOffersReady,
  keepMac,
  tags,
} = useV2vVmMapping(() => vm.vm, {
  list: () => vm.list,
  listIssue: () => vm.listIssue,
  inventory: useV2vConnection().inventory,
})
</script>
