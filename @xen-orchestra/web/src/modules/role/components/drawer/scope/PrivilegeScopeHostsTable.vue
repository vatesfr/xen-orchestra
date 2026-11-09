<template>
  <div class="privilege-scope-hosts-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings :selection-bindings="readonly ? undefined : selectionBindings">
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
import { useHostQueryBuilder } from '@/modules/host/composables/use-host-query-builder.composable.ts'
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { getHostIpAddresses } from '@/modules/pif/utils/xo-pif.util.ts'
import { usePrivilegeScopeSelection } from '@/modules/role/composables/use-privilege-scope-selection.composable.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useHostColumns } from '@core/tables/column-sets/host-columns.ts'
import { logicAnd, logicNot, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { visibleIds, readonly = false } = defineProps<{
  visibleIds?: string[]
  readonly?: boolean
}>()

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] })

const { t } = useI18n()

const { hosts, areHostsReady, hasHostFetchError, isMasterHost } = useXoHostCollection()

const visibleHosts = computed(() =>
  visibleIds === undefined ? hosts.value : hosts.value.filter(host => visibleIds.includes(host.id))
)

const { pifsByHost, arePifsReady, hasPifFetchError } = useXoPifCollection()

const isReady = logicAnd(areHostsReady, arePifsReady)

const {
  items: filteredHosts,
  filter,
  schema,
} = useHostQueryBuilder('privilege-scope-hosts', visibleHosts, {
  ignoreRoute: true,
})

const state = useTableState({
  busy: logicNot(isReady),
  error: logicOr(hasHostFetchError, hasPifFetchError),
  empty: () =>
    visibleHosts.value.length === 0
      ? t('no-host-detected')
      : filteredHosts.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('privilege-scope-hosts', filteredHosts, {
  ignoreRoute: true,
})

const { pageSelectionModel, isSelected, toggleSelection, selectionBindings } = usePrivilegeScopeSelection({
  selectedIds,
  items: visibleHosts,
  filteredItems: filteredHosts,
  pageItems: paginatedHosts,
  isReady,
})

function getMasterIcon(host: FrontXoHost) {
  if (!isMasterHost(host.id)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('master'),
  }
}

const { HeadCells, BodyCells } = useHostColumns({
  exclude: ['srStatus', 'selectItem'],
  head: () => ({
    checkbox: r => (readonly ? r() : r(pageSelectionModel)),
  }),
  body: (host: FrontXoHost) => {
    const ipAddresses = computed(() => getHostIpAddresses(host.address, pifsByHost.value.get(host.id)))
    const hostIcon = computed(() => getHostIcon(host))
    const rightIcon = computed(() => getMasterIcon(host))

    return {
      checkbox: r => (readonly ? r() : r({ selected: isSelected(host.id), onToggle: () => toggleSelection(host.id) })),
      host: r =>
        r({
          label: host.name_label,
          to: { name: '/host/[id]/dashboard', params: { id: host.id } },
          icon: hostIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(host.name_description),
      ipAddresses: r => r(ipAddresses.value),
      tags: r => r(host.tags),
    }
  },
})
</script>

<style lang="postcss" scoped>
.privilege-scope-hosts-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
