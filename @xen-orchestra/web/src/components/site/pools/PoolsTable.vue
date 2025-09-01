<template>
  <div class="pools-table">
    <UiTitle>
      {{ t('pools') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:square-caret-down"
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
            left-icon="fa:eraser"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('forget') }}
          </UiButton>
        </UiTableActions>
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
          <UiTablePagination v-if="areServersReady" v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready="areServersReady"
        :has-error="hasServerFetchError"
        :no-data-message="servers.length === 0 ? t('no-server-detected') : undefined"
      >
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <div v-tooltip="t('coming-soon')">
                  <UiCheckbox disabled :v-model="areAllSelected" accent="brand" @update:model-value="toggleSelect" />
                </div>
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon v-tooltip="t('coming-soon')" icon="fa:ellipsis" accent="brand" disabled size="small" />
              </th>
              <th v-else>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon accent="brand" size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of poolsRecords"
            :key="row.id"
            :class="{ selected: selectedServerId === row.id }"
            @click="selectedServerId = row.id"
          >
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo-body-regular-small"
              :class="{ checkbox: column.id === 'checkbox' }"
            >
              <div v-if="column.id === 'checkbox'" v-tooltip="t('coming-soon')">
                <UiCheckbox v-model="selected" disabled accent="brand" :value="row.id" />
              </div>
              <UiButtonIcon
                v-else-if="column.id === 'more'"
                v-tooltip="t('coming-soon')"
                icon="fa:ellipsis"
                accent="brand"
                disabled
                size="small"
              />
              <div v-else-if="column.id === 'label' || column.id === 'primary-host'">
                <UiLink
                  v-if="column.value !== undefined"
                  size="medium"
                  :to="column.value.to"
                  :icon="column.value.icon"
                  @click.stop
                >
                  {{ column.value.label }}
                </UiLink>
              </div>
              <UiInfo v-else-if="column.id === 'status'" :accent="column.value.accent">
                {{ column.value.text }}
              </UiInfo>
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredServers.length === 0" format="table" type="no-result">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
        <UiTablePagination v-if="areServersReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import type { XoServer } from '@/types/xo/server.type.ts'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import useMultiSelect from '@core/composables/table/multi-select.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { icon, type IconName } from '@core/icons'
import { createMapper } from '@core/packages/mapper'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers } = defineProps<{
  servers: XoServer[]
}>()

const { t } = useI18n()

const { areServersReady, hasServerFetchError } = useXoServerCollection()
const { getHostById } = useXoHostCollection()
const selectedServerId = useRouteQuery('id')

const searchQuery = ref('')

const filteredServers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return servers
  }

  return servers.filter(server =>
    Object.values(server).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const serverIds = computed(() => servers.map(server => server.id))

const { selected, areAllSelected } = useMultiSelect(serverIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? serverIds.value : []
}

const getStatusInfo = createMapper(
  {
    error: { accent: 'danger', text: t('unable-to-connect-to-the-pool') },
    disconnected: { accent: 'muted', text: t('disconnected') },
    connected: { accent: 'success', text: t('connected') },
    connecting: { accent: 'info', text: t('connecting') },
  },
  'error'
)

const getPoolInfo = (server: XoServer) => {
  if (server.poolNameLabel) {
    return {
      label: server.poolNameLabel,
      to: server.poolId ? `/pool/${server.poolId}/` : undefined,
      icon: icon('fa:city'),
    }
  }

  if (server.poolId) {
    return {
      label: server.poolId,
      to: `/pool/${server.poolId}/`,
      icon: icon('fa:city'),
    }
  }

  return undefined
}

const getPrimaryHost = (server: XoServer) => {
  const masterHost = getHostById(server.master)

  return masterHost
    ? { label: masterHost.name_label, to: `/host/${masterHost.id}/`, icon: icon('fa:server') }
    : undefined
}

const { visibleColumns, rows } = useTable('servers', filteredServers, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('label', record => getPoolInfo(record), { label: t('pool') }),
    define('host', { label: t('ip-address') }),
    define('status', record => getStatusInfo(record.error ? 'error' : record.status), { label: t('status') }),
    define('primary-host', record => getPrimaryHost(record), { label: t('master') }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: poolsRecords, paginationBindings } = usePagination('pools', rows)

type ServerHeader = 'label' | 'host' | 'status' | 'primary-host'

const headerIcon: Record<ServerHeader, IconName> = {
  label: 'fa:city',
  host: 'fa:hashtag',
  status: 'fa:square-caret-down',
  'primary-host': 'fa:server',
}
</script>

<style scoped lang="postcss">
.pools-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pools-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
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
