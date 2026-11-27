<template>
  <div class="vm-backup-archive-restore-export-destination">
    <VmBackupArchiveRestoreRichRadioGroup v-bind="form.bindings.destination" />

    <VtsTabularKeyValueList v-if="isDownload">
      <VtsTabularKeyValueRow :label="t('file-name')" :value="fileName" />
    </VtsTabularKeyValueList>

    <template v-else>
      <VmBackupArchiveRestoreFormSelect v-bind="form.bindings.backupRepository">
        <template #option="{ option }">
          <VtsDetailedOption :option :details="option.properties.details" />
        </template>
      </VmBackupArchiveRestoreFormSelect>
      <UiInfo accent="info" wrap>{{ t('the-file-goes-into-the-xo-exports-folder') }}</UiInfo>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('path')" :value="path" />
      </VtsTabularKeyValueList>
    </template>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreFormSelect from '@/modules/backup-archive/components/form/inputs/VmBackupArchiveRestoreFormSelect.vue'
import VmBackupArchiveRestoreRichRadioGroup from '@/modules/backup-archive/components/form/inputs/VmBackupArchiveRestoreRichRadioGroup.vue'
import type { RestoreVmBackupArchiveExportDiskForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-disk-form.ts'
import type { RestoreVmBackupArchiveExportVmForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-vm-form.ts'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveExportDiskForm | RestoreVmBackupArchiveExportVmForm
}>()

const { t } = useI18n()

const { isDownload, fileName, path } = form
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-export-destination {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
