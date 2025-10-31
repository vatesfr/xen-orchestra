<template>
  <div class="hosts-table">
    <UiTitle>{{ t('hosts') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :no-data-message="hosts.length === 0 ? t('no-host-detected') : undefined"
        :has-error
        :is-ready="!tableReady"
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
            v-for="row of hostsRecords"
            :key="row.id"
            :class="{ selected: selectedHostId === row.id }"
            @click="selectedHostId = row.id"
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
              <div v-else-if="column.id === 'host'">
                <UiObjectLink :route="`/host/${column.value.id}/`" @click.stop>
                  <template #icon>
                    <VtsObjectIcon size="medium" :state="isHostRunning(column.value.state)" type="host" />
                  </template>
                  {{ column.value.label }}
                </UiObjectLink>
              </div>
              <span v-else-if="column.id === 'description'" v-tooltip class="text-ellipsis">
                {{ column.value }}
              </span>
              <span
                v-else-if="column.id === 'ip-addresses'"
                v-tooltip="[column.value].join(', ')"
                class="text-ellipsis ip-addresses"
              >
                <span class="text-ellipsis">{{ column.value[0] }}</span>
                <span v-if="column.value.length > 1" class="typo-body-regular-small more-ips">
                  {{ `+${column.value.length - 1}` }}
                </span>
              </span>
              <span v-else-if="column.id === 'tags'">
                <template v-if="column.value.length > 0">
                  <UiTagsList>
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
      <VtsStateHero v-if="searchQuery && filteredHosts.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection'
import type { XoHost } from '@/types/xo/host.type'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import useMultiSelect from '@core/composables/table/multi-select.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { HOST_POWER_STATE } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { hosts, hostReady } = defineProps<{
  hosts: XoHost[]
  hostReady: boolean
  hasError: boolean
}>()

const hostsId = computed(() => hosts.map(host => host.id))

const { t } = useI18n()

const searchQuery = ref('')

const selectedHostId = useRouteQuery('id')
const { pifsByHost, arePifsReady } = useXoPifCollection()
const { selected, areAllSelected } = useMultiSelect(hostsId)

const tableReady = logicAnd(arePifsReady, hostReady)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? hostsId.value : []
}

const filteredHosts = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return hosts
  }

  return hosts.filter(host => Object.values(host).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const getIpAddresses = (host: XoHost) => {
  const pifs = pifsByHost.value.get(host.id)
  if (!pifs) {
    return []
  }

  return pifs.reduce<string[]>((acc, pif) => {
    if (pif.ip) {
      acc.push(pif.ip)
    }

    if (pif.ipv6) {
      acc.push(...pif.ipv6.filter(ip => ip))
    }

    return acc
  }, [])
}

const { visibleColumns, rows } = useTable('hosts', filteredHosts, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('host', record => ({ label: record.name_label, id: record.id, state: record.power_state }), {
      label: t('name'),
    }),
    define('description', record => record.name_description, { label: t('description') }),
    define('ip-addresses', record => getIpAddresses(record), { label: t('ip-addresses') }),
    define('tags', record => record.tags, { label: t('tags') }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: hostsRecords, paginationBindings } = usePagination('hosts', rows)

type HostHeader = 'host' | 'description' | 'ip-addresses' | 'tags'

const headerIcon: Record<HostHeader, IconName> = {
  host: 'fa:a',
  description: 'fa:align-left',
  'ip-addresses': 'fa:align-left',
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

<style scoped lang="postcss">
.container,
.hosts-table,
.table-actions {
  display: flex;
  flex-direction: column;
}

.hosts-table {
  gap: 2.4rem;

  .table-actions {
    gap: 0.8rem;
  }

  .ip-addresses {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .more-ips {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .more {
    width: 4.8rem;
  }

  .checkbox {
    text-align: center;
    line-height: 1;
  }
}
</style>
