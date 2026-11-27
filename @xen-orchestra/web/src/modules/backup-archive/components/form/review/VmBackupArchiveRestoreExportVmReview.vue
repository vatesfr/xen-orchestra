<template>
  <div class="vm-backup-archive-restore-export-vm-review">
    <BackupJobReviewSection :title="t('export-the-vm')" @edit="emit('edit')">
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('format')" :value="formatLabel" />
        <VtsTabularKeyValueRow :label="t('compression')" :value="compressionLabel" />
        <VtsTabularKeyValueRow :label="t('content')" :value="contentLabel" />
        <VtsTabularKeyValueRow :label="t('destination')">
          <template #value>
            <span class="destination">
              <VtsIcon :name="isDownload ? 'action:download' : 'fa:database'" size="medium" />
              {{ destinationLabel }}
            </span>
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow v-if="isDownload" :label="t('file-name')" :value="fileName" />
        <VtsTabularKeyValueRow v-else :label="t('path')" :value="path" />
      </VtsTabularKeyValueList>
      <VmBackupArchiveRestoreExportNotice
        :is-download="isDownload"
        :proxy-name
        download-keypath="export-vm-download-notice"
      />
    </BackupJobReviewSection>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreExportNotice from '@/modules/backup-archive/components/form/export/VmBackupArchiveRestoreExportNotice.vue'
import type { RestoreVmBackupArchiveExportVmForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-vm-form.ts'
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveExportVmForm
}>()

const emit = defineEmits<{
  edit: []
}>()

const { t } = useI18n()

const { formatLabel, compressionLabel, contentLabel, isDownload, destinationLabel, fileName, path, proxyName } = form
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-export-vm-review {
  .destination {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
