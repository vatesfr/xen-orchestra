<template>
  <div class="networks">
    <UiCard class="container">
      <HostPifsTable :pifs />
    </UiCard>
    <HostPifsSidePanel :pif :network />
  </div>
</template>

<script setup lang="ts">
import HostPifsSidePanel from '@/components/host/HostPifsSidePanel.vue'
import HostPifsTable from '@/components/host/HostPifsTable.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoHost } from '@/types/xo/host.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

defineProps<{
  host: XoHost
}>()

const { records } = usePifStore().subscribe()
const { get } = useNetworkStore().subscribe()

const pifId = useRouteQuery('id')
const route = useRoute()

const hostId = route.params.id as XoHost['id']
const pifs = computed(() => {
  return records.value.filter(pif => {
    return pif.$host === hostId
  })
})

const pif = computed(() => records.value.find(pif => pif.id === pifId.value))
const network = computed(() => (pif.value ? get(pif.value.$network) : undefined))
</script>

<style scoped lang="postcss">
.networks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;
  height: 100%;
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
