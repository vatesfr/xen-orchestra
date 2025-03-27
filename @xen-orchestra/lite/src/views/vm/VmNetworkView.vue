<template>
  <div class="vm-network-view">
    <UiCard class="container">
      <VmVifsTable :vifs />
    </UiCard>
    <VmVifsSidePanel v-if="selectedVif" :vif="selectedVif" />
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import VmVifsSidePanel from '@/components/vm/network/VmVifsSidePanel.vue'
import VmVifsTable from '@/components/vm/network/VmVifsTable.vue'
import type { XenApiVif } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useArrayFilter } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records } = useVifStore().subscribe()
const { getByOpaqueRef } = useVmStore().subscribe()

const route = useRoute()

usePageTitleStore().setTitle(useI18n().t('network'))

const vifs = useArrayFilter(records, vif => {
  const vm = getByOpaqueRef(vif.VM)

  return vm?.uuid === route.params.uuid
})

const selectedVif = useRouteQuery<XenApiVif | undefined>('id', {
  toData: id => vifs.value.find(vif => vif.uuid === id),
  toQuery: vif => vif?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.vm-network-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
