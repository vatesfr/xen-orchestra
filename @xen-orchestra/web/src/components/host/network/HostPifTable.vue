<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ t('pifs') }}
      <template #actions>
        <UiButton
          v-tooltip="t('coming-soon')"
          disabled
          left-icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
        >
          {{ t('scan-pifs') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:edit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:trash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('delete') }}
          </UiButton>
        </UiTableActions>
      </div>

      <VtsTableNew :busy="!arePifsReady" :error="hasPifFetchError" sticky="right" :pagination-bindings>
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="pif of paginatedPifs" :key="pif.id" :selected="selectedPifId === pif.id">
            <BodyCells :item="pif" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import { getPifStatus } from '@/utils/xo-records/pif.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { usePifColumns } from '@core/tables/column-sets/pif-columns'
import type { XoPif } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs: rawPifs } = defineProps<{
  pifs: XoPif[]
}>()

const { arePifsReady, hasPifFetchError } = useXoPifCollection()
const { getNetworkById } = useXoNetworkCollection()

const { t } = useI18n()

const selectedPifId = useRouteQuery('id')
const searchQuery = ref('')

const filteredPifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawPifs
  }

  return rawPifs.filter(pif => Object.values(pif).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const getNetworkName = (pif: XoPif) => getNetworkById(pif.$network)?.name_label ?? ''

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getIpAddresses = (pif: XoPif) => [pif.ip, ...pif.ipv6].filter(ip => ip)

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

const { pageRecords: paginatedPifs, paginationBindings } = usePagination('pifs', filteredPifs)

const { HeadCells, BodyCells } = usePifColumns({
  body: (pif: XoPif) => ({
    network: r =>
      r({
        label: getNetworkName(pif),
        rightIcon: pif.management ? { icon: 'legacy:primary', tooltip: t('management') } : undefined,
      }),
    device: r => r(pif.device),
    status: r => r(getPifStatus(pif)),
    vlan: r => r(getVlanData(pif.vlan)),
    ip: r => r(getIpAddresses(pif)),
    mac: r => r(pif.mac),
    mode: r => r(getIpConfigurationMode(pif.mode)),
    selectId: r => r(() => (selectedPifId.value = pif.id)),
  }),
})
</script>

<style scoped lang="postcss">
.host-pif-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.host-pif-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .network {
    display: flex;
    align-items: center;
    gap: 1.8rem;
  }

  .ip-addresses {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .more-ips {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .checkbox,
  .more {
    width: 4.8rem;
  }

  .checkbox {
    text-align: center;
    line-height: 1;
  }
}
</style>
