<template>
  <div class="host-network-view">
    <PifTable :pifs="pifsWthNetworkInfo" />
    <PifPanel :pif="selectedPif" />
  </div>
</template>

<script setup lang="ts">
import PifPanel from '@/components/pif/PifPanel.vue'
import PifTable from '@/components/pif/PifTable.vue'
import { getNetwork } from '@/fakeGetNetwork'
import { pifsByHost } from '@/fakePifStore'
import { computed, ref } from 'vue'

const pifs = computed(() => pifsByHost.get('438aca0f-429c-4ae6-accc-93c306e636a0') ?? [])
const network = ref(getNetwork)

const pifsWthNetworkInfo = computed(() =>
  pifs.value.map(pif => ({
    ...pif,
    networkID: network.value.id,
    name_label: network.value.name_label,
    nbd: network.value.nbd ? 'on' : 'off',
    tags: network.value.tags,
    defaultIsLocked: network.value.defaultIsLocked ? 'on' : 'off',
  }))
)
const selectedPif = computed(() => pifsWthNetworkInfo.value[0])
</script>

<style scoped lang="postcss">
.host-network-view {
  display: flex;
  height: 100%;
}
</style>
