<template>
  <VtsContentSidePanel class="network">
    <UiCard class="container">
      <HostPifsTable :pifs :host />
    </UiCard>
    <HostPifSidePanel :pif="selectedPif" @close="selectedPif = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import HostPifSidePanel from '@/components/host/network/HostPifSidePanel.vue'
import HostPifsTable from '@/components/host/network/HostPifsTable.vue'
import type { XenApiHost, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records } = usePifStore().subscribe()
const { getByOpaqueRef: getHostOpaqueRef, getByUuid: getHostByUuid } = useHostStore().subscribe()

const route = useRoute<'/host/[uuid]/network'>()

const { t } = useI18n()
usePageTitleStore().setTitle(t('network'))

const host = computed(() => getHostByUuid(route.params.uuid as XenApiHost['uuid']))

const pifs = computed(() => {
  return records.value.filter(pif => {
    const host = getHostOpaqueRef(pif.host)

    return host?.uuid === route.params.uuid
  })
})

const selectedPif = useRouteQuery<XenApiPif | undefined>('id', {
  toData: id => pifs.value.find(pif => pif.uuid === id),
  toQuery: pif => pif?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.network {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
