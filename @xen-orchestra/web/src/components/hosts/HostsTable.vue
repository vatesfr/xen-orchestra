<template>
  <div class="hosts-table">
    <UiTitle>{{ t('hosts') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTableNew :busy="!isReady" :pagination-bindings="paginationBindings" sticky="right">
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
import { getPifsIpAddresses } from '@/components/hosts/get-pif-ip-addresses'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { objectIcon } from '@core/icons'
import { useHostColumns } from '@core/tables/column-sets/host-columns'
import type { XoHost } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { toLower } from 'lodash-es'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { hostReady, hosts: rawHosts } = defineProps<{
  hosts: XoHost[]
  hasError: boolean
  hostReady: boolean
}>()

const { t } = useI18n()

const searchQuery = ref('')

const selectedHostId = useRouteQuery('id')

const { pifsByHost, arePifsReady } = useXoPifCollection()

const { isMasterHost } = useXoHostCollection()

const isReady = logicAnd(arePifsReady, () => hostReady)

const filteredHosts = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawHosts
  }

  return rawHosts.filter(host =>
    Object.values(host).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', filteredHosts)

function getMasterIcon(host: XoHost) {
  if (!pif.management) {
    return undefined
  }

  return {
    icon: icon('legacy:primary'),
    tooltip: t('master'),
  }
}

const { HeadCells, BodyCells } = useHostColumns({
  body: (host: XoHost) => ({
    host: r =>
      r({
        label: host.name_label,
        to: `/host/${host.id}/dashboard`,
        icon: objectIcon('host', toLower(host.power_state)),
        rightIcon: getMasterIcon(host)
      }),
    description: r => r(host.name_description),
    ipAddresses: r => r(getPifsIpAddresses(pifsByHost.value.get(host.id))),
    tags: r => r(host.tags),
    selectId: r => r(() => (selectedHostId.value = host.id)),
  }),
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

  .host,
  .tags,
  .ip-addresses {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .more-info {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .tags,
  .ip-addresses {
    justify-content: space-between;
  }
}
</style>
