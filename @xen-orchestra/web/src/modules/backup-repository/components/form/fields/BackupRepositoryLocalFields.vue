<template>
  <BackupRepositoryFormRow wide>
    <FormTextInput v-bind="bindings.path" />
  </BackupRepositoryFormRow>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import type { LocalBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'

defineProps<{
  bindings: LocalBackupRepositoryDetailsForm['bindings']
}>()
</script>
