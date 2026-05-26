<template>
  <div class="vm-network-view" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <VmVifsTable :vifs />
    </UiCard>
    <VmVifsSidePanel :vif="selectedVif" @close="selectedVif = undefined" />
  </div>
</template>

<script lang="ts" setup>
import VmVifsSidePanel from '@/components/vm/network/VmVifsSidePanel.vue'
import VmVifsTable from '@/components/vm/network/VmVifsTable.vue'
import type { XenApiVif } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useArrayFilter } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records } = useVifStore().subscribe()
const { getByOpaqueRef } = useVmStore().subscribe()
const panelStore = usePanelStore()
const uiStore = useUiStore()

const route = useRoute<'/vm/[uuid]/network'>()

const { t } = useI18n()
usePageTitleStore().setTitle(t('network'))

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
  &.locked:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
