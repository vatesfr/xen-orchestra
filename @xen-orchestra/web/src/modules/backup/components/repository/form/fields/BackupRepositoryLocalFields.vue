<template>
  <BackupRepositoryFormRow wide>
    <BackupRepositoryFormTextInput v-bind="bindings.path" />
  </BackupRepositoryFormRow>
</template>

<script lang="ts" setup>
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormTextInput.vue'
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/BackupRepositoryFormRow.vue'
import type { LocalBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-local-backup-repository-details-form.js'

defineProps<{
  bindings: LocalBackupRepositoryDetailsForm['bindings']
}>()
</script>
