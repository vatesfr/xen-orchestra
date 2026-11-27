<template>
  <div class="vm-backup-archive-restore-export-disk-review">
    <BackupJobReviewSection :title="t('export-a-disk')" @edit="emit('edit')">
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('disk')" :value="diskLabel" />
        <VtsTabularKeyValueRow :label="t('format')" :value="formatLabel" />
        <VtsTabularKeyValueRow :label="t('size')" :value="sizeLabel" />
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
        download-keypath="export-disk-review-download-notice"
      />
    </BackupJobReviewSection>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreExportNotice from '@/modules/backup-archive/components/form/export/VmBackupArchiveRestoreExportNotice.vue'
import type { RestoreVmBackupArchiveExportDiskForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-disk-form.ts'
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveExportDiskForm
}>()

const emit = defineEmits<{
  edit: []
}>()

const { t } = useI18n()

const {
  selectedDisk,
  selectedDiskSize,
  formattedDiskSize,
  isRawFormat,
  formatHint,
  formatLabel: diskFormatLabel,
  isDownload,
  destinationLabel,
  fileName,
  path,
  proxyName,
} = form

const diskLabel = computed(() =>
  selectedDisk.value === undefined
    ? undefined
    : [form.getDiskName(selectedDisk.value), form.getFormattedDiskSize(selectedDisk.value)]
        .filter(part => part !== undefined)
        .join(' · ')
)

const formatLabel = computed(() => `${diskFormatLabel.value} · ${formatHint.value}`)

const sizeLabel = computed(() => {
  if (isRawFormat.value) {
    return selectedDiskSize.value === undefined ? t('unknown') : formattedDiskSize.value
  }

  return `${t('up-to-size', { size: formattedDiskSize.value })} · ${t('depends-on-the-data-and-the-format')}`
})
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-export-disk-review {
  .destination {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
