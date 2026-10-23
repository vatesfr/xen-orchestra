<template>
  <div class="privilege-scope-srs-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="sr of paginatedSrs" :key="sr.id">
          <BodyCells :item="sr" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { usePrivilegeScopeSelection } from '@/modules/role/composables/use-privilege-scope-selection.composable.ts'
import { useSrQueryBuilder } from '@/modules/storage-repository/composables/use-sr-query-builder.composable.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrPageLocation } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useSrColumns } from '@core/tables/column-sets/sr-columns.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const selectedIds = defineModel<string[]>('selectedIds', { required: true })

// A privilege is not bound to a pool or a host, so the SRs are shown as on the pool storage page.
const SCOPE: SrScope = { type: SR_SCOPE_TYPE.POOL }

const { t } = useI18n()

const { srs, areSrsReady, hasSrFetchError, isDefaultSr } = useXoSrCollection()

const {
  items: filteredSrs,
  filter,
  schema,
} = useSrQueryBuilder('privilege-scope-srs', srs, {
  ignoreRoute: true,
})

const state = useTableState({
  busy: logicNot(areSrsReady),
  error: hasSrFetchError,
  empty: () =>
    srs.value.length === 0
      ? t('no-storage-repository-detected')
      : filteredSrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { pageRecords: paginatedSrs, paginationBindings } = usePagination('privilege-scope-srs', filteredSrs, {
  ignoreRoute: true,
})

const { pageSelectionModel, isSelected, toggleSelection, selectionBindings } = usePrivilegeScopeSelection({
  selectedIds,
  items: srs,
  filteredItems: filteredSrs,
  pageItems: paginatedSrs,
  isReady: areSrsReady,
})

function getPrimaryIcon(sr: FrontXoSr) {
  if (!isDefaultSr(sr)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('default-storage-repository'),
  }
}

const { HeadCells, BodyCells } = useSrColumns({
  exclude: ['actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (sr: FrontXoSr) => {
    const rightIcon = computed(() => getPrimaryIcon(sr))

    const { srStatusIcon, getSrAccessModeLabel } = useXoSrUtils(sr, () => SCOPE)

    return {
      checkbox: r => r({ selected: isSelected(sr.id), onToggle: () => toggleSelection(sr.id) }),
      storageRepository: r =>
        r({
          label: sr.name_label,
          to: getSrPageLocation(sr, SCOPE),
          icon: srStatusIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(sr.name_description),
      storageFormat: r => r(sr.SR_type),
      accessMode: r => r(getSrAccessModeLabel(sr)),
      usedSpace: r => r(sr.physical_usage, sr.size),
    }
  },
})
</script>

<style lang="postcss" scoped>
.privilege-scope-srs-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
