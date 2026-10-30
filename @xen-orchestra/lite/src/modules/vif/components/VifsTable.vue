<template>
  <div class="vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <VtsTable :state :pagination-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vif of paginatedVifs" :key="vif.uuid" :selected="selectedVifId === vif.uuid">
          <BodyCells :item="vif" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVifConnection } from '@/modules/vif/composables/use-vif-connection.composable.ts'
import {
  type VifFilterableData,
  useVifQueryBuilder,
} from '@/modules/vif/composables/use-vif-query-builder.composable.ts'
import { useVifStore } from '@/stores/xen-api/vif.store.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useMapper } from '@core/packages/mapper'
import { type ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useVifColumns } from '@core/tables/column-sets/vif-columns.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { logicNot } from '@vueuse/math'
import { useI18n } from 'vue-i18n'

const { vifs, vm } = defineProps<{
  vifs: XenApiVif[]
  vm: XenApiVm
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { isReady, hasError } = useVifStore().subscribe()

const { t } = useI18n()

const selectedVifId = useRouteQuery('id')

const { items: filteredVifs, filter, schema } = useVifQueryBuilder('vif', () => vifs, { vm: () => vm })

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    vifs.length === 0 ? t('no-vif-detected') : filteredVifs.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vifs', filteredVifs)

const { HeadCells, BodyCells } = useVifColumns({
  body: (vif: VifFilterableData) => {
    const {
      connectVifs,
      disconnectVifs,
      canConnectVifs,
      canDisconnectVifs,
      isConnectingVifs,
      isDisconnectingVifs,
      connectVifsErrorMessage,
      disconnectVifsErrorMessage,
    } = useVifConnection({
      vifs: () => [vif],
      vm: () => vm,
    })

    const connectionAction = useMapper(
      () => (vif.currently_attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
      () => ({
        connect: {
          label: t('action:connect'),
          icon: 'action:connect',
          onClick: () => connectVifs(),
          disabled: !canConnectVifs.value,
          busy: isConnectingVifs.value,
          hint: canConnectVifs.value ? undefined : connectVifsErrorMessage.value,
        } satisfies ActionItem,
        disconnect: {
          label: t('action:disconnect'),
          icon: 'action:disconnect',
          onClick: () => disconnectVifs(),
          disabled: !canDisconnectVifs.value,
          busy: isDisconnectingVifs.value,
          hint: canDisconnectVifs.value ? undefined : disconnectVifsErrorMessage.value,
        } satisfies ActionItem,
      }),
      'connect'
    )

    return {
      network: r => r({ label: vif.network_name }),
      device: r => r(vif.device_label),
      status: r => r(vif.currently_attached ? 'connected' : 'disconnected'),
      ipsAddresses: r => r(vif.ip_addresses),
      macAddresses: r => r(vif.MAC),
      mtu: r => r(vif.MTU),
      lockingMode: r => r(vif.locking_mode),
      actions: r =>
        r({
          onClick: () => (selectedVifId.value = vif.uuid),
          actions: [connectionAction.value],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vifs-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
