<template>
  <div class="backup-job-target-storage-repository-table">
    <VtsQueryBuilder v-if="isManual" :model-value="searchFilter" :schema @search="searchFilter = $event" />
    <BackupJobFormQueryInput v-else v-model="filter" :label="t('dynamic-selection-query')" :schema :error required />

    <VtsTable :state :pagination-bindings :selection-bindings="isManual ? selectionBindings : undefined">
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

    <UiInfo v-for="message of isManual ? errorMessages : []" :key="message" accent="danger" wrap>{{ message }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormQueryInput from '@/modules/backup-job/components/form/inputs/BackupJobFormQueryInput.vue'
import { useBackupJobIdSelection } from '@/modules/backup-job/composables/use-backup-job-id-selection.composable.ts'
import { toErrorMessages } from '@/modules/backup-job/utils/backup-job-error-messages.util.ts'
import { useSrFormQueryBuilder } from '@/modules/storage-repository/composables/use-sr-form-query-builder.composable.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrPageLocation } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useSrColumns } from '@core/tables/column-sets/sr-columns.ts'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { mode, srs, matchedSrs, error } = defineProps<{
  mode: 'manual' | 'smart'
  srs: FrontXoSr[]
  matchedSrs?: FrontXoSr[]
  error?: InputWrapperMessage
}>()

const selectedIds = defineModel<FrontXoSr['id'][]>('selectedIds', { required: true })

const filter = defineModel<string>('filter', { required: true })

const { t } = useI18n()

const isManual = computed(() => mode === 'manual')

const {
  items: searchedSrs,
  filter: searchFilter,
  schema,
} = useSrFormQueryBuilder('backup-job-target-srs', () => srs, { ignoreRoute: true })

const displayedSrs = computed(() => (isManual.value ? searchedSrs.value : (matchedSrs ?? [])))

const { pageRecords: paginatedSrs, paginationBindings } = usePagination('backup-job-target-srs', displayedSrs, {
  ignoreRoute: true,
})

const { isSelected, toggleSelection, pageSelectionModel, selectionBindings } = useBackupJobIdSelection(
  selectedIds,
  () => srs,
  displayedSrs,
  paginatedSrs
)

const state = useTableState({
  empty: () =>
    srs.length === 0
      ? t('no-storage-repository-detected')
      : displayedSrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const errorMessages = computed(() => toErrorMessages(error))

const { HeadCells, BodyCells, toggle } = useSrColumns({
  exclude: ['description', 'accessMode', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (sr: FrontXoSr) => {
    const { srStatusIcon } = useXoSrUtils(sr)

    return {
      checkbox: r => r({ selected: isSelected(sr.id), onToggle: () => toggleSelection(sr.id) }),
      storageRepository: r =>
        r({
          label: sr.name_label,
          to: getSrPageLocation(sr, { type: SR_SCOPE_TYPE.POOL }),
          icon: srStatusIcon.value,
        }),
      storageFormat: r => r(sr.SR_type),
      usedSpace: r => r(sr.physical_usage, sr.size),
    }
  },
})

if (mode === 'smart') {
  toggle('checkbox', false)
}
</script>

<style lang="postcss" scoped>
.backup-job-target-storage-repository-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
