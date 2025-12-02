<template>
  <CollectionTable
    :available-filters="filters"
    :available-sorts="filters"
    :collection="paginatedVms"
    :busy="busy"
    :pagination-bindings
  >
    <template #head-row>
      <HeadCells />
    </template>
    <template #body-row="{ item }">
      <BodyCells :item />
    </template>
  </CollectionTable>
</template>

<script lang="ts" setup>
import CollectionTable from '@/components/CollectionTable.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVbdStore } from '@/stores/xen-api/vbd.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store'
import type { Filters } from '@/types/filter'
import { usePagination } from '@core/composables/pagination.composable'
import { objectIcon } from '@core/icons'
import { useVmColumns } from '@core/tables/column-sets/vm-columns'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell'
import { formatSizeRaw } from '@core/utils/size.util'
import { VM_POWER_STATE } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms } = defineProps<{
  vms: XenApiVm[]
  busy?: boolean
  error?: boolean
}>()

const { getByOpaqueRef: getGuestMetrics, isReady: areGuestMetricsReady } = useVmGuestMetricsStore().subscribe()
const { getByOpaqueRef: getVmMetrics } = useVmMetricsStore().subscribe()
const { getByOpaqueRefs: getVbds } = useVbdStore().subscribe()
const { getByOpaqueRefs: getVdis } = useVdiStore().subscribe()

const { t } = useI18n()

const filters: Filters = {
  name_label: { label: t('name'), type: 'string' },
  name_description: { label: t('description'), type: 'string' },
  power_state: {
    label: t('power-state'),
    icon: 'fa:power-off',
    type: 'enum',
    choices: Object.values(VM_POWER_STATE),
  },
}

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', vms)

const { HeadCells, BodyCells } = useVmColumns({
  exclude: ['selectItem'],
  body: (vm: XenApiVm) => {
    const guestMetrics = computed(() => getGuestMetrics(vm.guest_metrics))

    const vmMetrics = computed(() => getVmMetrics(vm.metrics))

    const ips = computed(() => [...new Set(Object.values(guestMetrics.value?.networks ?? {}).sort())])

    const ram = computed(() => formatSizeRaw(vm.memory_dynamic_max, 0))

    const vcpus = computed(() => vmMetrics.value?.VCPUs_number ?? vm.VCPUs_at_startup)

    const vbds = computed(() => getVbds(vm.VBDs).filter(vbd => vbd.type === 'Disk'))

    const vdis = computed(() => getVdis(vbds.value.map(vbd => vbd.VDI)))

    const diskSpace = computed(() =>
      formatSizeRaw(
        vdis.value.reduce((total, vdi) => total + (vdi.virtual_size ?? 0), 0),
        1
      )
    )

    return {
      vm: r => r({ label: vm.name_label, icon: objectIcon('vm', toLower(vm.power_state)) }),
      ipAddresses: r => (areGuestMetricsReady.value ? r(ips.value) : renderLoadingCell()),
      vcpus: r => (vcpus.value ? r(vcpus.value) : renderBodyCell()),
      ram: r => (ram.value.value ? r(ram.value.value, ram.value.prefix) : renderBodyCell()),
      diskSpace: r => r(diskSpace.value.value, diskSpace.value.prefix),
      tags: r => r(vm.tags),
    }
  },
})
</script>
