<template>
  <div class="vm-backup-archive-restore-download-files-review">
    <BackupJobReviewSection :title="t('choose-files')" @edit="emit('edit')">
      <UiSubtitle>{{ t('source') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('disk')">
          <template #value>
            <span class="value">
              <VtsIcon name="object:vdi" size="medium" />
              {{ selectedDisk?.name || t('unknown') }}
              <template v-if="diskSize !== undefined">{{ t('dot-prefix', { value: formatSize(diskSize, 1) }) }}</template>
            </span>
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow v-if="selectedPartition !== undefined" :label="t('partition')">
          <template #value>
            {{ selectedPartition.name ?? selectedPartition.id }}
            {{ t('dot-prefix', { value: formatSize(selectedPartition.size, 1) }) }}
          </template>
        </VtsTabularKeyValueRow>
      </VtsTabularKeyValueList>

      <UiSubtitle>{{ t('files') }}</UiSubtitle>
      <VmBackupArchiveRestoreFilesTree :root-label :selection="formData.selection" />

      <UiSubtitle>{{ t('archive') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('format')" :value="formatLabel" />
        <VtsTabularKeyValueRow :label="t('file-name')" :value="fileName" />
      </VtsTabularKeyValueList>

      <UiAlert accent="info">
        <I18nT keypath="download-files-built-on-the-fly" scope="global" tag="span">
          <template #builder>
            <b>{{ builderName }}</b>
          </template>
        </I18nT>
      </UiAlert>
    </BackupJobReviewSection>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreFilesTree from '@/modules/backup-archive/components/form/files/VmBackupArchiveRestoreFilesTree.vue'
import type { RestoreVmBackupArchiveDownloadFilesForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-download-files-form.ts'
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveDownloadFilesForm
}>()

const emit = defineEmits<{
  edit: []
}>()

const {
  formData,
  backupArchive,
  selectedDisk,
  selectedDiskSize: diskSize,
  selectedPartition,
  rootLabel,
  formatLabel,
  fileName,
} = form

const { t } = useI18n()

const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

const { useGetProxyById } = useXoProxyCollection()

const backupRepository = useGetBackupRepositoryById(() => backupArchive.value.backupRepository)

const proxy = useGetProxyById(() => backupRepository.value?.proxy)

const builderName = computed(() => proxy.value?.name ?? t('xen-orchestra'))
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-download-files-review {
  .value {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
