<template>
  <div class="backup-repository-nfs-fields">
    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="hostInputBindings" />
      <BackupRepositoryFormTextInput v-bind="portInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="pathInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="customOptionsInputBindings" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'

type TextInputBindings = ModelBinding<string> &
  FieldMetadata & { label: string; required?: boolean; placeholder?: string; info?: string }

defineProps<{
  hostInputBindings: TextInputBindings
  portInputBindings: TextInputBindings
  pathInputBindings: TextInputBindings
  customOptionsInputBindings: TextInputBindings
}>()
</script>

<style lang="postcss" scoped>
.backup-repository-nfs-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
