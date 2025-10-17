<template>
  <div class="host-table">
    <div class="table-actions">
      <UiQuerySearchBar @search="value => (searchQuery = value)" />
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
    <VtsDataTable
      :no-data-message="hosts.length === 0 ? t('no-hosts-available') : undefined"
      :is-ready="arePifsReady && hostReady"
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
          v-for="row of spacesRecords"
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
              <UiLink
                v-if="column.value !== undefined"
                v-tooltip
                size="medium"
                :to="`/host/${column.value.id}/`"
                :icon="`object:host:${isHostRunning(column.value.state)}`"
                class="link text-ellipsis"
                @click.stop
              >
                {{ column.value.label }}
              </UiLink>
            </div>

            <span v-else-if="column.id === 'description'">
              {{ column.value }}
            </span>

            <span
              v-else-if="column.id === 'ipv4-address'"
              v-tooltip="
                `${column.value.masterIp}${column.value.pif.length > 0 ? ', ' : ''}${column.value.pif.join(', ')}`
              "
              class="text-ellipsis"
            >
              <span class="text-ellipsis">{{ column.value.masterIp }}</span>
              <span v-if="column.value.pif.length > 0" class="typo-body-regular-small more-ips">
                {{ ` +${column.value.pif.length}` }}
              </span>
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
    <VtsStateHero v-if="searchQuery && filteredHosts.length === 0" format="table" type="no-result" size="medium">
      {{ t('no-result') }}
    </VtsStateHero>
    <div class="table-actions">
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
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import useMultiSelect from '@core/composables/table/multi-select.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { HOST_POWER_STATE } from '@vates/types'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { hosts } = defineProps<{
  hosts: XoHost[]
  hostReady: boolean
}>()

const hostsId = computed(() => hosts.map(host => host.id))

const { t } = useI18n()
const selectedHostId = useRouteQuery('id')

const { pifsByHost, arePifsReady } = useXoPifCollection()
const { selected, areAllSelected } = useMultiSelect(hostsId)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? hostsId.value : []
}

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
    define('checkbox', noop, { label: '', isHideable: false }),
    define('host', record => ({ label: record.name_label, id: record.id, state: record.power_state }), {
      label: t('name'),
    }),
    define('description', record => record.name_description, { label: t('description') }),
    define(
      'ipv4-address',
      record => ({
        masterIp: record.address,
        pif:
          pifsByHost.value
            .get(record.id)
            ?.map(pif => pif.ip)
            .filter(ip => ip !== '' && ip !== record.address) ?? [],
      }),
      {
        label: t('ip-addresses'),
      }
    ),
    define('tags', record => record.tags, { label: t('tags') }),
    define('more', noop, { label: '', isHideable: false }),
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

<style scoped lang="postcss">
.host-table,
.table-actions {
  display: flex;
  flex-direction: column;
}

.host-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .checkbox,
  .more {
    width: 4.8rem;
  }

  .link {
    width: 100%;
  }

  .checkbox {
    text-align: center;
    line-height: 1;
  }
}
</style>
