<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ t('pifs') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <div class="container">
      <VtsQueryBuilder v-model="filter" :schema />
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="pif of paginatedPifs" :key="pif.uuid" :selected="selectedPifId === pif.uuid">
            <BodyCells :item="pif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { usePifForget } from '@/modules/pif/composables/use-pif-forget.composable.ts'
import {
  type PifFilterableData,
  usePifQueryBuilder,
} from '@/modules/pif/composables/use-pif-query-builder.composable.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { usePifColumns } from '@core/tables/column-sets/pif-columns.ts'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs } = defineProps<{
  pifs: XenApiPif[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { isReady, hasError } = usePifStore().subscribe()

const { t } = useI18n()

const selectedPifId = useRouteQuery('id')

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getIpConfigurationMode = (ipMode: string) => {
  switch (ipMode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
}

const { items: filteredPifs, filter, schema } = usePifQueryBuilder('pif', () => pifs)

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    pifs.length === 0 ? t('no-pif-detected') : filteredPifs.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedPifs, paginationBindings } = usePagination('pifs', filteredPifs)

function getManagementIcon(pif: XenApiPif) {
  if (!pif.management) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('management'),
  }
}

const { HeadCells, BodyCells } = usePifColumns({
  exclude: ['selectItem'],
  body: (pif: PifFilterableData) => {
    const vlan = computed(() => getVlanData(pif.VLAN))
    const ipMode = computed(() => getIpConfigurationMode(pif.ip_configuration_mode))
    const rightIcon = computed(() => getManagementIcon(pif))

    const { forgetPifs, canForgetPifs, isForgettingPifs, forgetPifsErrorMessage } = usePifForget(() => [pif])

    return {
      network: r => r({ label: pif.network_name }),
      device: r => r(pif.device, { rightIcon: rightIcon.value }),
      status: r => r(pif.status),
      vlan: r => r(vlan.value),
      ip: r => r(pif.ip_addresses),
      mac: r => r(pif.MAC),
      mode: r => r(ipMode.value),
      actions: r =>
        r({
          onClick: () => (selectedPifId.value = pif.uuid),
          actions: [
            {
              label: t('action:forget'),
              icon: 'action:forget',
              onClick: () => forgetPifs(),
              busy: isForgettingPifs.value,
              disabled: !canForgetPifs.value,
              hint: forgetPifsErrorMessage.value,
              accent: 'danger',
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.host-pif-table,
.container {
  display: flex;
  flex-direction: column;
}

.host-pif-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
