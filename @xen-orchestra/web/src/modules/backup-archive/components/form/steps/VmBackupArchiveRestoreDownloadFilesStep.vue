<template>
  <div class="vm-backup-archive-restore-download-files-step">
    <section class="section">
      <UiTitle>{{ t('source') }}</UiTitle>
      <BackupJobFormRow>
        <VtsInputWrapper :label="t('disk')" :message="getMessages(bindings.disk.infos, bindings.disk.error)">
          <VtsSelect :id="bindings.disk.id" accent="neutral" />
        </VtsInputWrapper>
        <VtsInputWrapper
          :label="t('partition')"
          :message="getMessages(bindings.partition.infos, bindings.partition.error)"
        >
          <VtsSelect :id="bindings.partition.id" accent="neutral" />
        </VtsInputWrapper>
      </BackupJobFormRow>
      <UiInfo v-if="hasPartitionsError" accent="danger" wrap>{{ t('error-no-data') }}</UiInfo>
    </section>

    <section class="section">
      <UiTitle>
        {{ t('files') }}
        <template #action>
          <span class="typo-body-regular-small">{{ t('open-a-folder-by-its-name') }}</span>
        </template>
      </UiTitle>
      <VmBackupArchiveRestoreFilesExplorer
        v-if="canBrowse && formData.diskId !== undefined"
        :key="`${formData.diskId}/${formData.partitionId}`"
        v-bind="bindings.selection"
        :archive-id="backupArchive.id"
        :disk-id="formData.diskId"
        :partition-id="formData.partitionId"
        :root-label
      />
    </section>

    <section class="section">
      <UiTitle>{{ t('archive') }}</UiTitle>
      <VmBackupArchiveRestoreRichRadioGroup v-bind="bindings.format" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreFilesExplorer from '@/modules/backup-archive/components/form/files/VmBackupArchiveRestoreFilesExplorer.vue'
import VmBackupArchiveRestoreRichRadioGroup from '@/modules/backup-archive/components/form/inputs/VmBackupArchiveRestoreRichRadioGroup.vue'
import type { RestoreVmBackupArchiveDownloadFilesForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-download-files-form.ts'
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveDownloadFilesForm
}>()

const { formData, bindings, backupArchive, hasPartitionsError, canBrowse, rootLabel } = form

const { t } = useI18n()

function getMessages(infos: string[], error: string | undefined): InputWrapperMessage {
  return error === undefined ? infos : [...infos, { content: error, accent: 'danger' }]
}
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-download-files-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
