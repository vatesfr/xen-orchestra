<template>
  <div class="site-pools-table">
    <UiTitle>
      {{ $t('pools') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="$t('table-actions')">
          <UiButton
            v-tooltip="$t('coming-soon')"
            disabled
            :left-icon="faCaretSquareDown"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ $t('change-state') }}
          </UiButton>
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
            :left-icon="faEraser"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ $t('forget') }}
          </UiButton>
        </UiTableActions>
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect" />
      </div>
      <VtsDataTable
        :is-ready="isServerReady && isHostReady"
        :has-error
        :no-data-message="servers.length === 0 ? $t('no-network-detected') : undefined"
      >
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
              <div v-else-if="column.id === 'label' || column.id === 'primary_host'">
                <UiLink
                  size="medium"
                  :disabled="column.value.value?.to === undefined"
                  :to="column.value.value?.to"
                  :icon="column.value.value.icon"
                  @click.stop
                >
                  {{ column.value.value.label }}
                </UiLink>
              </div>
              <UiInfo v-else-if="column.id === 'status'" :accent="column.value.value.accent">
                {{ column.value.value.text }}
              </UiInfo>
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
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useServerStore } from '@/stores/xo-rest-api/server.store.ts'
import type { XoServer } from '@/types/xo/server.type.ts'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
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
  faCaretSquareDown,
  faCity,
  faEdit,
  faEllipsis,
  faEraser,
  faHashtag,
  faServer,
} from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/shared'
import { computed, ref, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers } = defineProps<{
  servers: XoServer[]
}>()

const { t } = useI18n()

const { isReady: isServerReady, hasError } = useServerStore().subscribe()
const { isReady: isHostReady, getMasterHostByPoolId } = useHostStore().subscribe()

const selectedServerId = useRouteQuery('id')

const searchQuery = ref('')

const filteredServers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return servers
  }

  return servers.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const serverIds = computed(() => servers.map(network => network.id))

const { selected, areAllSelected } = useMultiSelect(serverIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? serverIds.value : []
}

const getStatus = (server: XoServer): ComputedRef<{ accent: InfoAccent; text: string }> =>
  computed(() => {
    if (server.error) {
      return { accent: 'danger', text: t('error') }
    }

    switch (server.status) {
      case 'disconnected':
        return { accent: 'muted', text: t('disconnected') }
      case 'connected':
        return { accent: 'success', text: t('connected') }
      case 'connecting':
        return { accent: 'info', text: t('connecting') }
      default:
        return { accent: 'muted', text: t('unknown') }
    }
  })

const getPoolInfo = (server: XoServer) =>
  computed(() => {
    if (server.poolNameLabel) {
      return {
        label: server.poolNameLabel,
        to: server.poolId ? `/pool/${server.poolId}/` : undefined,
        icon: faCity,
      }
    }

    return {
      label: server.id,
      to: server.poolId ? `/pool/${server.poolId}/` : undefined,
      icon: faCity,
    }
  })

// compute this
const getPrimaryHost = (server: XoServer) =>
  computed(() => {
    const host = server.poolId ? getMasterHostByPoolId(server.poolId) : undefined
    return host
      ? { label: host.name_label, to: `/host/${host.id}/`, icon: faServer }
      : { label: '', to: undefined, icon: faServer }
  })

const { visibleColumns, rows } = useTable('servers', filteredServers, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('label', record => getPoolInfo(record), { label: t('pool') }),
    define('host', { label: t('ip-address') }),
    define('status', record => getStatus(record), { label: t('status') }),
    define('primary_host', record => getPrimaryHost(record), { label: t('master') }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

type ServerHeader = 'label' | 'host' | 'status' | 'primary_host'

const headerIcon: Record<ServerHeader, IconDefinition> = {
  label: faCity,
  host: faHashtag,
  status: faCaretSquareDown,
  primary_host: faServer,
}
</script>

<style scoped lang="postcss">
.site-pools-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container,
  .table-actions {
    display: flex;
    flex-direction: column;
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
