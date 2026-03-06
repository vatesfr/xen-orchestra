<template>
  <div class="hosts-table">
    <UiTitle>{{ t('hosts') }}</UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="host of paginatedHosts" :key="host.id" :selected="selectedHostId === host.id">
            <BodyCells :item="host" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { getPifsIpAddresses } from '@/modules/pif/utils/xo-pif.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { icon, objectIcon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useHostColumns } from '@core/tables/column-sets/host-columns'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { logicAnd, logicNot, logicOr } from '@vueuse/math'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  busy,
  hosts: rawHosts,
  error,
} = defineProps<{
  hosts: FrontXoHost[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedHostId = useRouteQuery('id')

const { pifsByHost, arePifsReady, hasPifFetchError } = useXoPifCollection()

const { isMasterHost } = useXoHostCollection()

const isReady = logicAnd(() => !busy, arePifsReady)

const hasError = logicOr(() => error, hasPifFetchError)

const { items: filteredHosts, filter } = useQueryBuilderFilter('hosts', () => rawHosts)

const schema = useQueryBuilderSchema<FrontXoHost>({
  '': useStringSchema(t('any-property')),
  name_label: useStringSchema(t('name')),
  name_description: useStringSchema(t('description')),
  address: useStringSchema(t('ip-address')),
  power_state: useStringSchema(t('power-state'), {
    [HOST_POWER_STATE.RUNNING]: t('status:running'),
    [HOST_POWER_STATE.HALTED]: t('status:halted'),
    [HOST_POWER_STATE.UNKNOWN]: t('status:unknown'),
  }),
  tags: useStringSchema(t('tags')),
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    rawHosts.length === 0 ? t('no-host-detected') : filteredHosts.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', filteredHosts)

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
  body: (host: FrontXoHost) => {
    const ipAddresses = computed(() => getPifsIpAddresses(pifsByHost.value.get(host.id)))
    const hostIcon = computed(() => objectIcon('host', toLower(host.power_state)))
    const rightIcon = computed(() => getMasterIcon(host))

    return {
      host: r =>
        r({
          label: host.name_label,
          to: `/host/${host.id}/dashboard`,
          icon: hostIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(host.name_description),
      ipAddresses: r => r(ipAddresses.value),
      tags: r => r(host.tags),
      selectItem: r => r(() => (selectedHostId.value = host.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.container,
.hosts-table {
  display: flex;
  flex-direction: column;
}

.hosts-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
