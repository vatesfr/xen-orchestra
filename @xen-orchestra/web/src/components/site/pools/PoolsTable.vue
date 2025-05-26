<template>
  <div class="pool-servers-table">
    <UiTitle>
      {{ $t('pools') }}
      <template #actions>
        <UiDropdownButton v-tooltip="$t('coming-soon')" disabled>
          {{ $t('new') }}
        </UiDropdownButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="$t('table-actions')">
          <UiButton
            v-tooltip="$t('coming-soon')"
            disabled
            :left-icon="faEdit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ $t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="$t('coming-soon')"
            disabled
            :left-icon="faCopy"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ $t('copy-info-json') }}
          </UiButton>
          <UiButton
            v-tooltip="$t('coming-soon')"
            disabled
            :left-icon="faTrash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ $t('delete') }}
          </UiButton>
        </UiTableActions>
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect" />
      </div>
      <!-- to fix is ready and has error -->
      <VtsDataTable is-ready :no-data-message="servers.length === 0 ? $t('no-pool-detected') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <div v-tooltip="$t('coming-soon')">
                  <UiCheckbox disabled :v-model="areAllSelected" accent="brand" @update:model-value="toggleSelect" />
                </div>
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon v-tooltip="$t('coming-soon')" :icon="faEllipsis" accent="brand" disabled size="small" />
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
            v-for="row of rows"
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
              <div v-if="column.id === 'checkbox'" v-tooltip="$t('coming-soon')">
                <UiCheckbox v-model="selected" disabled accent="brand" :value="row.id" />
              </div>
              <UiButtonIcon
                v-else-if="column.id === 'more'"
                v-tooltip="$t('coming-soon')"
                :icon="faEllipsis"
                accent="brand"
                disabled
                size="small"
              />
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredServers.length === 0" type="table" image="no-result">
        <div>{{ $t('no-result') }}</div>
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XoServer } from '@/types/xo/server.type'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import useMultiSelect from '@core/composables/table/multi-select.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import {
  faCity,
  faCopy,
  faEdit,
  faEllipsis,
  faHashtag,
  faServer,
  faSquareCaretDown,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers } = defineProps<{
  servers: XoServer[]
}>()

const { t } = useI18n()

const selectedServerId = useRouteQuery('id')

const searchQuery = ref('')

const filteredServers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) return servers
  return servers.filter(server =>
    Object.values(server).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const serverIds = computed(() => servers.map(server => server.host))

const { selected, areAllSelected } = useMultiSelect(serverIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? serverIds.value : []
}

const { visibleColumns, rows } = useTable('servers', filteredServers, {
  rowId: record => record.host,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('pool', record => record.poolNameLabel, { label: t('pool') }),
    define('ip_addresse', record => record.host, { label: t('host') }),
    define('status', record => (record.status === 'connected' ? t('connected') : t('disconnected')), {
      label: t('status'),
    }),
    define('primary_host', record => (record.poolNameLabel ? 'comming soon' : ''), {
      label: t('primary-host'),
    }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

type ServerHeader = 'pool' | 'ip_addresse' | 'status' | 'primary_host'

const headerIcon: Record<ServerHeader, IconDefinition> = {
  pool: faCity,
  ip_addresse: faHashtag,
  status: faSquareCaretDown,
  primary_host: faServer,
}
</script>

<style scoped lang="postcss">
.pool-servers-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pool-servers-table {
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
