<template>
  <div class="host-network-view">
    <UiCard class="container">
      <HostPifTable :pifs />
    </UiCard>
    <HostPifSidePanel :pif :network />
  </div>
</template>

<script lang="ts" setup>
import HostPifSidePanel from '@/components/host/network/HostPifSidePanel.vue'
import HostPifTable from '@/components/host/network/HostPifTable.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records } = usePifStore().subscribe()
const { getByOpaqueRef: getHostOpaqueRef } = useHostStore().subscribe()
const { getByOpaqueRef: getOpaqueRefNetwork } = useNetworkStore().subscribe()

const pifId = useRouteQuery('id')
const route = useRoute()

usePageTitleStore().setTitle(useI18n().t('network'))

const hostId = route.params.uuid as XenApiHost['uuid']

const pifs = computed(() => {
  return records.value.filter(pif => {
    const host = getHostOpaqueRef(pif.host)

    return host?.uuid === hostId
  })
})

const pif = computed(() => pifs.value.find(pif => pif.uuid === pifId.value))
const network = computed(() => (pif.value ? getOpaqueRefNetwork(pif.value.network) : undefined))
</script>

<style lang="postcss" scoped>
.host-network-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
