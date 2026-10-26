<template>
  <div class="backup-job-transfer-step">
    <div class="section">
      <UiTitle>{{ t('general-information') }}</UiTitle>

      <BackupJobFormRow>
        <BackupJobFormNumberInput v-bind="bindings.maxExportRate" :unit="t('bytes:mibs')" />
        <BackupJobFormNumberInput v-bind="bindings.concurrency" />
      </BackupJobFormRow>
    </div>

    <div class="section">
      <UiTitle>{{ t('incremental-specifics') }}</UiTitle>

      <UiLabel accent="neutral">{{ t('key-backup') }}</UiLabel>
      <BackupJobPendingMockup />

      <BackupJobFormCheckbox v-bind="bindings.preferNbd" />

      <BackupJobFormRow v-if="bindings.preferNbd.modelValue">
        <BackupJobFormNumberInput v-bind="bindings.nbdConcurrency" />
      </BackupJobFormRow>
    </div>

    <div class="section">
      <UiTitle>{{ t('snapshot') }}</UiTitle>

      <BackupJobFormRadio v-bind="bindings.snapshotMode" vertical />

      <BackupJobFormRadio v-bind="bindings.snapshotSync" />

      <BackupJobFormRow v-if="bindings.snapshotSync.modelValue === 'smart'">
        <BackupJobFormSelect v-bind="bindings.snapshotSyncTag" />
      </BackupJobFormRow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobPendingMockup from '@/modules/backup-job/components/form/BackupJobPendingMockup.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import type { BackupJobTransferForm } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobTransferForm['bindings']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-transfer-step {
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
