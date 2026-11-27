<template>
  <div class="vm-backup-archive-restore-disks-table">
    <VtsTable :state>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="row of rows" :key="row.id" :error="row.srError !== undefined">
          <BodyCells :item="row" />
        </VtsRow>
      </tbody>
    </VtsTable>
    <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>{{ errorMessage }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { useVmBackupArchiveRestoreDiskColumns } from '@/modules/backup-archive/components/form/disks/use-vm-backup-archive-restore-disk-columns.ts'
import VmBackupArchiveRestoreDiskCell from '@/modules/backup-archive/components/form/disks/VmBackupArchiveRestoreDiskCell.vue'
import VmBackupArchiveRestoreDiskStorageCell from '@/modules/backup-archive/components/form/disks/VmBackupArchiveRestoreDiskStorageCell.vue'
import type {
  VmBackupArchiveRestoreDiskAction,
  VmBackupArchiveRestoreDiskActionOption,
  VmBackupArchiveRestoreDiskRow,
} from '@/modules/backup-archive/types/vm-backup-archive-restore-disk-row.type.ts'
import { formatErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useFormSelect } from '@core/packages/form-select'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

const { rows, actionOptions, srs, defaultSrLabel, readOnlyLabel, getSrDetails, error } = defineProps<{
  rows: VmBackupArchiveRestoreDiskRow[]
  actionOptions: VmBackupArchiveRestoreDiskActionOption[]
  srs: FrontXoSr[]
  defaultSrLabel: string
  readOnlyLabel: string
  getSrDetails: (sr: FrontXoSr) => string
  error?: InputWrapperMessage
}>()

const emit = defineEmits<{
  selectAction: [diskId: VmBackupArchiveRestoreDiskRow['id'], action: VmBackupArchiveRestoreDiskAction]
  selectSr: [diskId: VmBackupArchiveRestoreDiskRow['id'], srId: FrontXoSr['id'] | undefined]
}>()

const { t } = useI18n()

const state = useTableState({
  empty: () => (rows.length === 0 ? t('no-vdi-detected') : false),
})

const errorMessage = computed(() => formatErrorMessage(error))

const { HeadCells, BodyCells } = useVmBackupArchiveRestoreDiskColumns({
  body: (row: VmBackupArchiveRestoreDiskRow) => {
    const action = computed({
      get: () => row.action,
      set: value => emit('selectAction', row.id, value),
    })

    const { id: actionSelectId } = useFormSelect(() => actionOptions, {
      model: action,
      option: {
        label: 'label',
        value: 'value',
      },
    })

    return {
      disk: r => r(h(VmBackupArchiveRestoreDiskCell, { name: row.name, note: row.note })),
      size: r => {
        const size = formatSizeRaw(row.size, 1)

        return r(size?.value, size?.prefix)
      },
      action: r => r(actionSelectId),
      storage: r =>
        r(
          h(VmBackupArchiveRestoreDiskStorageCell, {
            row,
            srs,
            defaultSrLabel,
            readOnlyLabel,
            getSrDetails,
            onSelectSr: (srId: FrontXoSr['id'] | undefined) => emit('selectSr', row.id, srId),
          })
        ),
    }
  },
})
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-disks-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
