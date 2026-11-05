<template>
  <NetworkPifsInfoCard :network />
</template>

<script setup lang="ts">
import NetworkPifsInfoCard from '@/modules/network/components/panel/cards/NetworkPifsInfoCard.vue'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()
</script>
