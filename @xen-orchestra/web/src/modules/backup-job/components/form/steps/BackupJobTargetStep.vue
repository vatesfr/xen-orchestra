<template>
  <div class="backup-job-target-step">
    <BackupJobFormCheckboxGroup v-if="hasStorageTargetChoice" v-bind="form.bindings.storageTargets" />
    <BackupJobTargetBackupRepositorySection
      v-if="hasBackupRepositorySection"
      :bindings="form.bindings"
      :brs="availableBackupRepositories"
      :compatible-brs="compatibleBackupRepositories"
      :matched-brs="matchedBackupRepositories"
      :has-retention-strategy
      :has-strict-gfs
    />
    <BackupJobTargetStorageRepositorySection
      v-if="hasStorageRepositorySection"
      :bindings="form.bindings"
      :srs="availableStorageRepositories"
      :matched-srs="matchedStorageRepositories"
    />
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormCheckboxGroup from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckboxGroup.vue'
import BackupJobTargetBackupRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetBackupRepositorySection.vue'
import BackupJobTargetStorageRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetStorageRepositorySection.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'

const { form } = defineProps<{
  form: BackupJobTargetForm
}>()

const {
  hasStorageTargetChoice,
  hasBackupRepositorySection,
  hasRetentionStrategy,
  hasStrictGfs,
  hasStorageRepositorySection,
  availableBackupRepositories,
  compatibleBackupRepositories,
  availableStorageRepositories,
  matchedBackupRepositories,
  matchedStorageRepositories,
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
