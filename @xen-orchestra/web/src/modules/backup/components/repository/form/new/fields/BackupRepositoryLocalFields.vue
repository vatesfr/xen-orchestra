<template>
  <BackupRepositoryFormRow wide>
    <BackupRepositoryFormTextInput v-bind="pathInputBindings" />
  </BackupRepositoryFormRow>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'

defineProps<{
  pathInputBindings: ModelBinding<string> &
    FieldMetadata & { label: string; required?: boolean; placeholder?: string; info?: string }
}>()
</script>
