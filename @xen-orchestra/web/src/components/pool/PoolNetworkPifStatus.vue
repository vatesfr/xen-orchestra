<template>
  <PifStatus :pifs="networkPIFs" />
</template>

<script setup lang="ts">
import PifStatus from '@/components/pif/PifStatus.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoNetwork } from '@/types/xo/network.type'
import { computed } from 'vue'

const { network } = defineProps<{
  network: XoNetwork
}>()

const { records: pifs } = usePifStore().subscribe()
const networkPIFs = computed(() => pifs.value.filter(pif => network.PIFs.includes(pif.id)))
</script>
