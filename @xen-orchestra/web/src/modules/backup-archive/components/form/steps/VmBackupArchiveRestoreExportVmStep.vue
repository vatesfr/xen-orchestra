<template>
  <div class="vm-backup-archive-restore-export-vm-step">
    <div class="sections">
      <section class="section">
        <UiTitle>{{ t('format') }}</UiTitle>
        <VtsTabularKeyValueList>
          <VtsTabularKeyValueRow :label="t('format')" :value="formatLabel" />
        </VtsTabularKeyValueList>
        <VmBackupArchiveRestoreRichRadioGroup v-bind="form.bindings.compression" />
      </section>

      <section class="section">
        <UiTitle>{{ t('destination') }}</UiTitle>
        <VmBackupArchiveRestoreExportDestination :form />
      </section>

      <VmBackupArchiveRestoreExportNotice
        :is-download="isDownload"
        :proxy-name
        download-keypath="export-vm-download-notice"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreExportDestination from '@/modules/backup-archive/components/form/export/VmBackupArchiveRestoreExportDestination.vue'
import VmBackupArchiveRestoreExportNotice from '@/modules/backup-archive/components/form/export/VmBackupArchiveRestoreExportNotice.vue'
import VmBackupArchiveRestoreRichRadioGroup from '@/modules/backup-archive/components/form/inputs/VmBackupArchiveRestoreRichRadioGroup.vue'
import type { RestoreVmBackupArchiveExportVmForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-vm-form.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveExportVmForm
}>()

const { t } = useI18n()

const { formatLabel, isDownload, proxyName } = form
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-export-vm-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;

  .sections {
    display: flex;
    flex-direction: column;
    gap: 4.8rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
