<template>
  <div class="backup-job-source-step">
    <BackupJobFormRadio v-bind="bindings.dataSource" />
    <BackupJobFormRadio v-bind="bindings.mode" />
    <template v-if="bindings.dataSource.modelValue === 'mirror'">
      <BackupJobFormSelect v-bind="bindings.proxy" />
      <div class="backup-repository-source">
        <BackupJobFormRadio v-bind="bindings.backupRepositorySourceType" />
        <BackupJobBackupRepositorySelectionTable />
      </div>
    </template>
    <BackupJobFormRadio v-bind="bindings.scopeType">
      <template #info>
        <UiInfo wrap accent="info">{{ t('replications-excluded-from-selection') }}</UiInfo>
      </template>
    </BackupJobFormRadio>
  </div>
</template>

<script lang="ts" setup>
import BackupJobBackupRepositorySelectionTable from '@/modules/backup-job/components/form/BackupJobBackupRepositorySelectionTable.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import type { BackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobSourceForm['bindings']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-source-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .backup-repository-source {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
