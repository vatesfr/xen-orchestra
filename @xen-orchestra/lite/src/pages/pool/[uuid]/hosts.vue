<template>
  <UiCard class="pool-hosts-view">
    <UiTitle>
      {{ t('hosts') }}
    </UiTitle>
    <VtsTable :state :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="host of paginatedHosts" :key="host.$ref">
          <BodyCells :item="host" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { objectIcon } from '@core/icons'
import { useHostColumns } from '@core/tables/column-sets/host-columns.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { sortByNameDescription } from '@core/utils/sort-by-name-description.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { isReady, hasError, records: hosts } = useHostStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

usePageTitleStore().setTitle(() => t('hosts'))

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () => (hosts.value.length === 0 ? t('no-host-detected') : false),
})

const { HeadCells, BodyCells, sortItems } = useHostColumns({
  exclude: ['checkbox', 'selectItem', 'srStatus'],
  body: (host: XenApiHost) => {
    const state = isHostRunning(host) ? 'running' : 'halted'

    return {
      host: r => r({ label: host.name_label, to: `/host/${host.uuid}/dashboard`, icon: objectIcon('host', state) }),
      description: r => r(host.name_description),
      tags: r => r(host.tags),
      ipAddresses: r => r(host.address),
    }
  },
  sort: {
    host: sortByNameLabel,
    description: sortByNameDescription,
    ipAddresses: (host1, host2) => compareStrings(host1.address, host2.address),
  },
})

const sortedHosts = computed(() => sortItems(hosts.value))

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', sortedHosts)
</script>

<style lang="postcss" scoped>
.pool-hosts-view {
  margin: 0.8rem;
}
</style>
