<template>
  <div class="backup-repository-nfs-fields">
    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.host" />
      <FormTextInput v-bind="bindings.port" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <FormTextInput v-bind="bindings.path" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextArea v-bind="bindings.customOptions" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextArea from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormTextArea.vue'
import type { NfsBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'

defineProps<{ bindings: NfsBackupRepositoryDetailsForm['bindings'] }>()
</script>

<style lang="postcss" scoped>
.backup-repository-nfs-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
