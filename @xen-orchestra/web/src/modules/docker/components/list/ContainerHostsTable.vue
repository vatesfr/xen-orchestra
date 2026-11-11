<template>
  <div class="container-hosts-table">
    <UiTitle>{{ t('container-hosts') }}</UiTitle>
    <UiQuerySearchBar v-bind="searchBindings" />
    <VtsTable :state :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="host of paginatedHosts" :key="host.id">
          <BodyCells :item="host" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { useDockerHostStatus } from '@/modules/docker/composables/use-docker-host-status.composable.ts'
import type { DockerTreeHost } from '@/modules/docker/types/docker.type.ts'
import { getDockerEngineKindLabel, getDockerHostIcon } from '@/modules/docker/utils/xo-docker-tree.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useSearchFilter } from '@core/composables/search-filter.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useContainerHostColumns } from '@core/tables/column-sets/container-host-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { hosts, busy, error } = defineProps<{
  hosts: DockerTreeHost[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { getDockerHostStatus } = useDockerHostStatus()

const { items: filteredHosts, searchBindings } = useSearchFilter(
  () => hosts,
  host => [host.label, getDockerEngineKindLabel(host.engine), getDockerHostStatus(host).label]
)

const state = useTableState({
  busy: () => busy && !error,
  error: () => error,
  empty: () => (hosts.length > 0 && filteredHosts.value.length === 0 ? { type: 'no-result' } : false),
})

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('container-hosts', filteredHosts)

const { HeadCells, BodyCells } = useContainerHostColumns({
  body: (host: DockerTreeHost) => {
    const status = computed(() => getDockerHostStatus(host))

    return {
      vm: r =>
        r({
          label: host.label,
          to: { name: '/vm/[id]/containers', params: { id: host.vm.id } },
          icon: getDockerHostIcon(host),
        }),
      type: r => r(getDockerEngineKindLabel(host.engine) ?? '-'),
      connection: r => r(status.value.label, status.value.accent),
    }
  },
})
</script>

<style lang="postcss" scoped>
.container-hosts-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
