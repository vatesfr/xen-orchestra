<template>
  <VtsContentSidePanel class="vdis">
    <UiCard class="container">
      <VdisTable v-if="vm" :vdis :vbds />
    </UiCard>
    <VdiSidePanel :vdi="selectedVdi" :vbd="selectedVbd" @close="selectedVdi = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiVdi, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useArrayFilter } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records: vbdRecords } = useVbdStore().subscribe()
const { getByOpaqueRefs: getVdis } = useVdiStore().subscribe()
const { getByUuid } = useVmStore().subscribe()

const route = useRoute<'/vm/[uuid]/vdis'>()
const { t } = useI18n()

usePageTitleStore().setTitle(t('vdis'))

const vm = computed(() => getByUuid(route.params.uuid as XenApiVm['uuid']))
const vbds = useArrayFilter(vbdRecords, vbd => vbd.VM === vm.value?.$ref && vbd.type === 'Disk')
const vdis = computed(() => getVdis(vbds.value.map(vbd => vbd.VDI)))

const selectedVdi = useRouteQuery<XenApiVdi | undefined>('id', {
  toData: id => vdis.value.find(vdi => vdi.uuid === id),
  toQuery: vdi => vdi?.uuid ?? '',
})

const selectedVbd = computed(() => vbds.value.find(vbd => vbd.VDI === selectedVdi.value?.$ref))
</script>

<style lang="postcss" scoped>
.vdis {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
