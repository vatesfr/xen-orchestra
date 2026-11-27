<template>
  <div class="vm-backup-archive-restore-export-disk-step">
    <div class="sections">
      <section class="section">
        <VmBackupArchiveRestoreRichRadioGroup v-bind="form.bindings.disk" />
      </section>

      <section class="section">
        <VmBackupArchiveRestoreRichRadioGroup v-bind="form.bindings.format" />
        <UiInfo accent="info" wrap>{{ sizeInfo }}</UiInfo>
      </section>

      <section class="section">
        <VmBackupArchiveRestoreExportDestination :form />
      </section>

      <VmBackupArchiveRestoreExportNotice
        :is-download="isDownload"
        :proxy-name
        download-keypath="export-disk-download-notice"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreExportDestination from '@/modules/backup-archive/components/form/export/VmBackupArchiveRestoreExportDestination.vue'
import VmBackupArchiveRestoreExportNotice from '@/modules/backup-archive/components/form/export/VmBackupArchiveRestoreExportNotice.vue'
import VmBackupArchiveRestoreRichRadioGroup from '@/modules/backup-archive/components/form/inputs/VmBackupArchiveRestoreRichRadioGroup.vue'
import type { RestoreVmBackupArchiveExportDiskForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-disk-form.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveExportDiskForm
}>()

const { sizeInfo, isDownload, proxyName } = form
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-export-disk-step {
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
