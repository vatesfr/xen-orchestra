<template>
  <div class="vm-migrate-vifs-table">
    <VtsTable :state :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="row in paginatedRows" :key="row.vif.id" :error="showErrors && flaggedVifIds.has(row.vif.id)">
          <BodyCells :item="row" />
        </VtsRow>
      </tbody>
    </VtsTable>
    <VtsFlagLegend v-if="flaggedRows.length > 0">{{ t('vifs-must-be-reassigned') }}</VtsFlagLegend>
    <VtsErrorList v-if="showErrors && flaggedRows.length > 0">
      <li v-for="row in flaggedRows" :key="row.vif.id">
        {{ t('vif-destination-network-required', { name: row.sourceNetwork?.name_label ?? row.vif.MAC }) }}
      </li>
    </VtsErrorList>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { VmMigrateVifRow } from '@/modules/vm/form/migrate/use-vm-migrate-mapping-form.ts'
import VtsErrorList from '@core/components/error-list/VtsErrorList.vue'
import VtsFlagLegend from '@core/components/table/VtsFlagLegend.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useVmMigrateVifColumns } from '@core/tables/column-sets/vm-migrate-vif-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { rows, networks, flaggedRows } = defineProps<{
  rows: VmMigrateVifRow[]
  networks: FrontXoNetwork[]
  flaggedRows: VmMigrateVifRow[]
  showErrors: boolean
}>()

const emit = defineEmits<{
  selectNetwork: [vifId: VmMigrateVifRow['vif']['id'], networkId: FrontXoNetwork['id'] | undefined]
}>()

const { t } = useI18n()

const { getPifsByIds } = useXoPifCollection()

const state = useTableState({
  empty: () => (rows.length === 0 ? t('no-vif-detected') : false),
})

const { pageRecords: paginatedRows, paginationBindings } = usePagination('vm-migrate-vifs', () => rows, {
  ignoreRoute: true,
})

const flaggedVifIds = computed(() => new Set(flaggedRows.map(row => row.vif.id)))

function getNetworkVlan(network: FrontXoNetwork | undefined) {
  if (network === undefined) {
    return undefined
  }

  const [firstPif] = getPifsByIds(network.PIFs)

  if (firstPif === undefined || firstPif.vlan === -1) {
    return undefined
  }

  return firstPif.vlan
}

const { HeadCells, BodyCells } = useVmMigrateVifColumns({
  body: (row: VmMigrateVifRow) => {
    const targetNetworkId = computed({
      get: () => row.targetNetworkId,
      set: networkId => emit('selectNetwork', row.vif.id, networkId),
    })

    const { id: networkSelectId } = useFormSelect(() => networks, {
      model: targetNetworkId,
      searchable: true,
      placeholder: () => t('action:select-network'),
      option: {
        label: 'name_label',
        value: 'id',
      },
    })

    const sourceVlan = computed(() => getNetworkVlan(row.sourceNetwork))

    const targetVlan = computed(() => getNetworkVlan(networks.find(network => network.id === row.targetNetworkId)))

    return {
      fromNetwork: r => r(row.sourceNetwork?.name_label ?? ''),
      fromDevice: r => r(t('vif-device', { device: row.vif.device })),
      fromVlan: r => r(sourceVlan.value),
      toNetwork: r => r(networkSelectId),
      toVlan: r => r(targetVlan.value),
      flag: r => r(flaggedVifIds.value.has(row.vif.id)),
    }
  },
})
</script>

<style lang="postcss" scoped>
.vm-migrate-vifs-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
