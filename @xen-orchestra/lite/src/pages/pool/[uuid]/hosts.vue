<template>
  <UiCard class="pool-hosts-view">
    <UiCardTitle subtitle>
      {{ t('hosts') }}
    </UiCardTitle>
    <VtsTable :busy="!isReady" :error="hasError" :empty="hosts.length === 0" :pagination-bindings>
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
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { objectIcon } from '@core/icons'
import { useHostColumns } from '@core/tables/column-sets/host-columns'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { isReady, hasError, records: hosts } = useHostStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

usePageTitleStore().setTitle(() => t('hosts'))

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', hosts)

const { HeadCells, BodyCells } = useHostColumns({
  exclude: ['selectItem'],
  body: (host: XenApiHost) => {
    const state = isHostRunning(host) ? 'running' : 'halted'

    return {
      host: r => r({ label: host.name_label, to: `/host/${host.uuid}/dashboard`, icon: objectIcon('host', state) }),
      description: r => r(host.name_description),
      tags: r => r(host.tags),
      ipAddresses: r => r(host.address),
    }
  },
})
</script>
