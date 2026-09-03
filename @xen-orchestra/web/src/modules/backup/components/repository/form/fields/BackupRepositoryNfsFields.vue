<template>
  <div class="backup-repository-nfs-fields">
    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.host" />
      <BackupRepositoryFormTextInput v-bind="bindings.port" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="bindings.path" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextArea v-bind="bindings.customOptions" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextArea from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextArea.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { NfsBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-nfs-backup-repository-details-form.ts'

defineProps<{ bindings: NfsBackupRepositoryDetailsForm['bindings'] }>()
</script>

<style lang="postcss" scoped>
.backup-repository-nfs-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
