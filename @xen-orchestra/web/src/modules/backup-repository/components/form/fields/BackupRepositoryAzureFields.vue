<template>
  <div class="backup-repository-azure-fields">
    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.hostName" />
      <FormCheckbox v-if="isAzurite" v-bind="bindings.useHttps" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.accountName" />
      <FormTextInput v-bind="bindings.key" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.containerName" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <FormTextInput v-bind="bindings.pathInContainer" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import type { AzureBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-azure-backup-repository-details-form.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'

defineProps<{
  bindings: AzureBackupRepositoryDetailsForm['bindings']
  isAzurite: boolean
}>()
</script>

<style lang="postcss" scoped>
.backup-repository-azure-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
