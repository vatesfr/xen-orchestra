<template>
  <BackupRepositoryFormRow wide>
    <BackupRepositoryFormTextInput v-bind="bindings.path" />
  </BackupRepositoryFormRow>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextInput from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormTextInput.vue'
import type { LocalBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'

defineProps<{
  bindings: LocalBackupRepositoryDetailsForm['bindings']
}>()
</script>
