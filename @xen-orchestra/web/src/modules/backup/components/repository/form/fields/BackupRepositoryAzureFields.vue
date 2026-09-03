<template>
  <div class="backup-repository-azure-fields">
    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.hostName" />
      <BackupRepositoryFormCheckbox v-if="isAzurite" v-bind="bindings.useHttps" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.accountName" />
      <BackupRepositoryFormTextInput v-bind="bindings.key" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.containerName" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="bindings.pathInContainer" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormCheckbox from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormCheckbox.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormTextInput.vue'
import type { AzureBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-azure-backup-repository-details-form.ts'

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
