<template>
  <VtsTabularKeyValueRow :label="t('host')" :value="form.formData.hostName" />
  <VtsTabularKeyValueRow v-if="isAzurite" :label="t('https')">
    <template #value>
      <VtsStatus :status="form.formData.useHttps" />
    </template>
  </VtsTabularKeyValueRow>
  <VtsTabularKeyValueRow :label="t('account-name')" :value="form.formData.accountName" />
  <VtsTabularKeyValueRow :label="t('key')" :value="maskedKey" />
  <VtsTabularKeyValueRow :label="t('container-name')" :value="form.formData.containerName" />
  <VtsTabularKeyValueRow :label="t('path-in-container')" :value="form.formData.pathInContainer" />
</template>

<script lang="ts" setup>
import type { AzureBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-azure-backup-repository-details-form.ts'
import { maskSecret } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: AzureBackupRepositoryDetailsForm
  isAzurite: boolean
}>()

const { t } = useI18n()

const maskedKey = computed(() => maskSecret(form.formData.key))
</script>
