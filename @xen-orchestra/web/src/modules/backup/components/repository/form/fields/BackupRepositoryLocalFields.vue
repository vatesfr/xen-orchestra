<template>
  <BackupRepositoryFormRow wide>
    <BackupRepositoryFormTextInput v-bind="bindings.path" />
  </BackupRepositoryFormRow>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormTextInput.vue'
import type { LocalBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-local-backup-repository-details-form.ts'

defineProps<{
  bindings: LocalBackupRepositoryDetailsForm['bindings']
}>()
</script>
