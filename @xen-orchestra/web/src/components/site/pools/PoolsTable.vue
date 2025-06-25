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
            :left-icon="faCaretSquareDown"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('change-state') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            :left-icon="faEdit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            :left-icon="faEraser"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('forget') }}
          </UiButton>
        </UiTableActions>
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
          <UiTablePagination v-if="isServerReady" v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready="isServerReady"
        :has-error
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
                <UiButtonIcon v-tooltip="t('coming-soon')" :icon="faEllipsis" accent="brand" disabled size="small" />
              </th>
              <th v-else>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon accent="brand" :icon="headerIcon[column.id]" />
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
                :icon="faEllipsis"
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
      <VtsStateHero v-if="searchQuery && filteredServers.length === 0" type="table" image="no-result">
        <div>{{ t('no-result') }}</div>
      </VtsStateHero>
      <VtsStateHero v-if="!servers.length" image="no-data" type="page" />
      <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
        <UiTablePagination v-if="isServerReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useServerStore } from '@/stores/xo-rest-api/server.store.ts'
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
import { createMapper } from '@core/packages/mapper'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import {
  faCaretSquareDown,
  faCity,
  faEdit,
  faEllipsis,
  faEraser,
  faHashtag,
  faServer,
} from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers } = defineProps<{
  servers: XoServer[]
}>()

const { t } = useI18n()

const { isReady: isServerReady, hasError } = useServerStore().subscribe()
const { get: getHostById } = useHostStore().subscribe()
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
      icon: faCity,
    }
  }

  if (server.poolId) {
    return {
      label: server.poolId,
      to: `/pool/${server.poolId}/`,
      icon: faCity,
    }
  }
  return undefined
}

const getPrimaryHost = (server: XoServer) => {
  const masterHost = server.master ? getHostById(server.master) : undefined
  return masterHost ? { label: masterHost.name_label, to: `/host/${masterHost.id}/`, icon: faServer } : undefined
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

const headerIcon: Record<ServerHeader, IconDefinition> = {
  label: faCity,
  host: faHashtag,
  status: faCaretSquareDown,
  'primary-host': faServer,
}
</script>

<style scoped lang="postcss">
.pools-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pool-table {
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
