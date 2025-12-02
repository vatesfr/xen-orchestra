<template>
  <div class="vm-vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #actions>
        <UiButton
          v-tooltip="t('coming-soon')"
          disabled
          size="medium"
          variant="secondary"
          accent="brand"
          left-icon="fa:plus"
        >
          {{ t('new-vif') }}
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
            left-icon="fa:power-off"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('change-state') }}
          </UiButton>
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

      <VtsTableNew
        :busy="!areVifsReady"
        :error="hasVifFetchError"
        :empty="emptyMessage"
        :pagination-bindings
        sticky="right"
      >
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="vif of paginatedVifs" :key="vif.id" :selected="selectedVifId === vif.id">
            <BodyCells :item="vif" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoVifCollection } from '@/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useVifColumns } from '@core/tables/column-sets/vif-columns'
import type { XoVif } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs: rawVifs } = defineProps<{
  vifs: XoVif[]
}>()

const { getNetworkById } = useXoNetworkCollection()
const { getVmById } = useXoVmCollection()
const { areVifsReady, hasVifFetchError } = useXoVifCollection()
const { t } = useI18n()

const selectedVifId = useRouteQuery('id')

const getNetworkName = (vif: XoVif) => getNetworkById(vif.$network)?.name_label ?? ''

const searchQuery = ref('')

const filteredVifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawVifs
  }

  return rawVifs.filter(vif =>
    [...Object.values(vif), getNetworkName(vif)].some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const emptyMessage = computed(() => {
  if (rawVifs.length === 0) {
    return t('no-vif-detected')
  }

  if (filteredVifs.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const getIpAddresses = (vif: XoVif) => {
  const addresses = getVmById(vif.$VM)?.addresses

  return addresses ? [...new Set(Object.values(addresses).sort())] : []
}

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vifs', filteredVifs)

const { HeadCells, BodyCells } = useVifColumns({
  body: (vif: XoVif) => {
    const networkName = computed(() => getNetworkName(vif))
    const ipAddresses = computed(() => getIpAddresses(vif))

    return {
      network: r => r({ label: networkName.value }),
      device: r => r(t('vif-device', { device: vif.device })),
      status: r => r(vif.attached ? 'connected' : 'disconnected'),
      ipsAddresses: r => r(ipAddresses.value),
      macAddresses: r => r(vif.MAC),
      mtu: r => r(vif.MTU),
      lockingMode: r => r(vif.lockingMode),
      selectItem: r => r(() => (selectedVifId.value = vif.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.vm-vifs-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .table-actions,
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
