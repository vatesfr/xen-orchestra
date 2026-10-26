<template>
  <div class="backup-job-target-step">
    <BackupJobFormCheckboxGroup v-if="hasStorageTargetChoice" v-bind="bindings.storageTargets" />
    <BackupJobTargetBackupRepositorySection v-if="hasBackupRepositorySection" :bindings />
    <BackupJobTargetStorageRepositorySection v-if="hasStorageRepositorySection" :bindings />
    <BackupJobTargetSnapshotRetentionSection v-if="hasSnapshotRetentionSection" :bindings />
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormCheckboxGroup from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckboxGroup.vue'
import BackupJobTargetBackupRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetBackupRepositorySection.vue'
import BackupJobTargetSnapshotRetentionSection from '@/modules/backup-job/components/form/target/BackupJobTargetSnapshotRetentionSection.vue'
import BackupJobTargetStorageRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetStorageRepositorySection.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'

defineProps<{
  bindings: BackupJobTargetForm['bindings']
  hasStorageTargetChoice: boolean
  hasBackupRepositorySection: boolean
  hasStorageRepositorySection: boolean
  hasSnapshotRetentionSection: boolean
}>()
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
