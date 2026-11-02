<template>
  <div class="backup-job-target-step">
    <BackupJobFormCheckboxGroup v-if="hasStorageTargetChoice" v-bind="form.bindings.storageTargets" />
    <BackupJobTargetBackupRepositorySection
      v-if="hasBackupRepositorySection"
      :bindings="backupRepository.bindings"
      :brs="backupRepository.availableBackupRepositories.value"
      :compatible-brs="backupRepository.compatibleBackupRepositories.value"
      :matched-brs="backupRepository.matchedBackupRepositories.value"
      :has-retention-strategy
      :has-strict-gfs
    />
    <BackupJobTargetStorageRepositorySection
      v-if="hasStorageRepositorySection"
      :bindings="storageRepository.bindings"
      :srs="storageRepository.availableStorageRepositories.value"
      :matched-srs="storageRepository.matchedStorageRepositories.value"
    />
    <BackupJobTargetHealthCheckSection v-if="hasHealthCheckSection" :bindings="healthCheck.bindings" />
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormCheckboxGroup from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckboxGroup.vue'
import BackupJobTargetBackupRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetBackupRepositorySection.vue'
import BackupJobTargetHealthCheckSection from '@/modules/backup-job/components/form/target/BackupJobTargetHealthCheckSection.vue'
import BackupJobTargetStorageRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetStorageRepositorySection.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'

const { form } = defineProps<{
  form: BackupJobTargetForm
}>()

const {
  backupRepository,
  storageRepository,
  healthCheck,
  hasStorageTargetChoice,
  hasBackupRepositorySection,
  hasRetentionStrategy,
  hasStrictGfs,
  hasHealthCheckSection,
  hasStorageRepositorySection,
} = form
</script>

<style lang="postcss" scoped>
.backup-job-target-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;
}
</style>
