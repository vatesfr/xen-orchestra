<template>
  <div class="backup-job-target-storage-repository-section">
    <UiTitle>{{ t('storage-repositories') }}</UiTitle>

    <div class="block">
      <span class="typo-body-bold">{{ t('general-information') }}</span>
      <BackupJobFormRadio v-bind="bindings.storageRepositoryScopeType" />
      <BackupJobPendingMockup v-if="bindings.storageRepositoryScopeType.modelValue !== 'all'" />
    </div>

    <BackupJobFormRadio v-bind="bindings.replicaDistribution" vertical />

    <div class="block">
      <span class="typo-body-bold">{{ t('retention') }}</span>
      <BackupJobFormRow>
        <BackupJobFormNumberInput v-bind="bindings.copyRetention" />
      </BackupJobFormRow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobPendingMockup from '@/modules/backup-job/components/form/BackupJobPendingMockup.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobTargetForm['bindings']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-target-storage-repository-section {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .block {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
