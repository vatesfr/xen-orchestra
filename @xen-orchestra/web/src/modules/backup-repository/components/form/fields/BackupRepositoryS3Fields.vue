<template>
  <div class="backup-repository-s3-fields">
    <div class="endpoint-row">
      <FormTextInput v-bind="bindings.endpoint" class="endpoint" />
      <div class="checkboxes">
        <FormCheckbox v-bind="bindings.useHttps" />
        <FormCheckbox v-if="bindings.useHttps.modelValue" v-bind="bindings.allowUnauthorized" />
      </div>
    </div>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.region" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.accessKeyId" />
      <FormTextInput v-bind="bindings.secret" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.bucket" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <FormTextInput v-bind="bindings.pathInBucket" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import type { S3BackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-s3-backup-repository-details-form.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'

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
