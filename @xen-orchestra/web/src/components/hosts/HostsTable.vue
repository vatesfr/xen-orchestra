<template>
  <div class="hosts-table">
    <UiTitle>{{ t('hosts') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTableNew :busy="!isReady" :error="hasError" :empty="emptyMessage" :pagination-bindings sticky="right">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="host of paginatedHosts" :key="host.id" :selected="selectedHostId === host.id">
            <BodyCells :item="host" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection'
import { getPifsIpAddresses } from '@/utils/xo-records/pif.util'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { icon, objectIcon } from '@core/icons'
import { useHostColumns } from '@core/tables/column-sets/host-columns'
import type { XoHost } from '@vates/types'
import { logicAnd, logicOr } from '@vueuse/math'
import { toLower } from 'lodash-es'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  busy,
  hosts: rawHosts,
  error,
} = defineProps<{
  hosts: XoHost[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const searchQuery = ref('')

const selectedHostId = useRouteQuery('id')

const { pifsByHost, arePifsReady, hasPifFetchError } = useXoPifCollection()

const { isMasterHost } = useXoHostCollection()

const isReady = logicAnd(() => !busy, arePifsReady)

const hasError = logicOr(() => error, hasPifFetchError)

const filteredHosts = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawHosts
  }

  return rawHosts.filter(host =>
    Object.values(host).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const emptyMessage = computed(() => {
  if (rawHosts.length === 0) {
    return t('no-hosts-detected')
  }

  if (filteredHosts.value.length === 0) {
    return t('no-results')
  }

  return undefined
})

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', filteredHosts)

function getMasterIcon(host: XoHost) {
  if (!isMasterHost(host.id)) {
    return undefined
  }

  return {
    icon: icon('legacy:primary'),
    tooltip: t('master'),
  }
}

const { HeadCells, BodyCells } = useHostColumns({
  body: (host: XoHost) => {
    const ipAddresses = computed(() => getPifsIpAddresses(pifsByHost.value.get(host.id)))
    const hostIcon = computed(() => objectIcon('host', toLower(host.power_state)))
    const rightIcon = computed(() => getMasterIcon(host))

    return {
      host: r =>
        r({
          label: host.name_label,
          to: `/host/${host.id}/dashboard`,
          icon: hostIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(host.name_description),
      ipAddresses: r => r(ipAddresses.value),
      tags: r => r(host.tags),
      selectItem: r => r(() => (selectedHostId.value = host.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.container,
.hosts-table,
.table-actions {
  display: flex;
  flex-direction: column;
}

.hosts-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
