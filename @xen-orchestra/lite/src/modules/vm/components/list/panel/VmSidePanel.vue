<template>
  <VtsSidePanel :has-selection="!!vm" @close="emit('close')">
    <template v-if="vm" #actions>
      <VmMainActions :vm />
    </template>
    <template v-if="vm" #default>
      <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <VmInfoCard :vm />
        <VmNetworkCard :vm />
        <VmResourcesCard :vm />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmMainActions from '@/modules/vm/components/actions/VmMainActions.vue'
import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import VmNetworkCard from '@/modules/vm/components/list/panel/cards/VmNetworkCard.vue'
import VmResourcesCard from '@/modules/vm/components/list/panel/cards/VmResourcesCard.vue'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { logicAnd } from '@vueuse/math'

defineProps<{
  vm?: XenApiVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { isReady: areVmMetricsReady } = useVmMetricsStore().subscribe()
const { isReady: areGuestMetricsReady } = useVmGuestMetricsStore().subscribe()
const { isReady: areVbdsReady } = useVbdStore().subscribe()
const { isReady: areVdisReady } = useVdiStore().subscribe()

const isReady = logicAnd(areVmMetricsReady, areGuestMetricsReady, areVbdsReady, areVdisReady)
</script>
