<template>
  <div class="backup-repository-s3-fields">
    <div class="endpoint-row">
      <BackupRepositoryFormTextInput v-bind="bindings.endpoint" class="endpoint" />
      <div class="checkboxes">
        <BackupRepositoryFormCheckbox v-bind="bindings.useHttps" />
        <BackupRepositoryFormCheckbox v-if="bindings.useHttps.modelValue" v-bind="bindings.allowUnauthorized" />
      </div>
    </div>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.region" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.accessKeyId" />
      <BackupRepositoryFormTextInput v-bind="bindings.secret" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.bucket" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="bindings.pathInBucket" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormCheckbox from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormCheckbox.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { S3BackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-s3-backup-repository-details-form.ts'

defineProps<{ bindings: S3BackupRepositoryDetailsForm['bindings'] }>()
</script>

<style lang="postcss" scoped>
.backup-repository-s3-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .endpoint-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    align-items: start;
    gap: 2.4rem;

    .checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
  }
}
</style>
