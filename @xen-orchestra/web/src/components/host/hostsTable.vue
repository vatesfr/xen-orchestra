<template>
  <div class="table-actions">
    <UiQuerySearchBar @search="value => (searchQuery = value)" />
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
  </div>
  <VtsDataTable is-ready :no-data-message="filteredHosts.length === 0 ? t('no-hosts-available') : undefined">
    <template #thead>
      <tr>
        <template v-for="column of visibleColumns" :key="column.id">
          <th>
            <div v-tooltip class="text-ellipsis">
              <VtsIcon size="medium" :name="headerIcon[column.id]" />
              {{ column.label }}
            </div>
          </th>
        </template>
      </tr>
    </template>
    <template #tbody>
      <tr v-for="row of spacesRecords" :key="row.id" class="typo-body-regular-small">
        <td v-for="column of row.visibleColumns" :key="column.id">
          <UiLink
            v-if="column.id === 'host'"
            :icon="`object:host:${isHostRunning(column.value.state)}`"
            :to="`/host/${column.value.id}/`"
            size="medium"
          >
            {{ column.value.label }}
          </UiLink>
          <span v-else-if="column.id === 'description'">
            {{ column.value }}
          </span>
          <span v-else-if="column.id === 'ipv4-address'">
            {{ column.value }}
          </span>
          <span v-else-if="column.id === 'tags'">
            <template v-if="column.value.length > 0">
              <UiTagsList class="value">
                <UiTag v-for="tag in column.value" :key="tag" accent="info" variant="secondary">
                  {{ tag }}
                </UiTag>
              </UiTagsList>
            </template>
          </span>
        </td>
      </tr>
    </template>
  </VtsDataTable>
  <div class="table-actions">
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
  </div>
</template>

<script setup lang="ts">
import type { XoHost } from '@/types/xo/host.type'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useTable } from '@core/composables/table.composable'
import { HOST_POWER_STATE } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { hosts } = defineProps<{
  hosts: XoHost[]
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredHosts = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return hosts
  }

  return hosts.filter(host => Object.values(host).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const { visibleColumns, rows } = useTable('hosts', filteredHosts, {
  rowId: record => record.id,
  columns: define => [
    define('host', record => ({ label: record.name_label, id: record.id, state: record.power_state }), {
      label: t('name'),
    }),
    define('description', record => record.name_description, { label: t('description') }),
    define('ipv4-address', record => record.address, { label: t('ip-addresses') }),
    define('tags', record => record.tags, { label: t('tags') }),
  ],
})

const { pageRecords: spacesRecords, paginationBindings } = usePagination('hosts', rows)

type HostHeader = 'host' | 'description' | 'ipv4-address' | 'tags'

const headerIcon: Record<HostHeader, IconName> = {
  host: 'fa:a',
  description: 'fa:align-left',
  'ipv4-address': 'fa:align-left',
  tags: 'fa:square-caret-down',
}

const isHostRunning = (host: HOST_POWER_STATE) => {
  if (host === HOST_POWER_STATE.RUNNING) {
    return 'running'
  } else if (host === HOST_POWER_STATE.HALTED) {
    return 'halted'
  } else {
    return 'unknown'
  }
}
</script>
