<template>
  <VtsTabularKeyValueRow :label="t('endpoint-url')" :value="form.formData.endpoint" />
  <VtsTabularKeyValueRow :label="t('https')">
    <template #value>
      <VtsStatus :status="form.formData.useHttps" />
    </template>
  </VtsTabularKeyValueRow>
  <VtsTabularKeyValueRow v-if="form.formData.useHttps" :label="t('unauthorized')">
    <template #value>
      <VtsStatus :status="form.formData.allowUnauthorized" />
    </template>
  </VtsTabularKeyValueRow>
  <VtsTabularKeyValueRow :label="t('region')" :value="form.formData.region" />
  <VtsTabularKeyValueRow :label="t('access-key-id')" :value="form.formData.accessKeyId" />
  <VtsTabularKeyValueRow :label="t('secret')" :value="maskedSecret" />
  <VtsTabularKeyValueRow :label="t('bucket-name')" :value="form.formData.bucket" />
  <VtsTabularKeyValueRow :label="t('path-in-bucket')" :value="form.formData.pathInBucket" />
</template>

<script lang="ts" setup>
import type { S3BackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-s3-backup-repository-details-form.ts'
import { maskSecret } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: S3BackupRepositoryDetailsForm
}>()

const { t } = useI18n()

const maskedSecret = computed(() => maskSecret(form.formData.secret))
</script>
