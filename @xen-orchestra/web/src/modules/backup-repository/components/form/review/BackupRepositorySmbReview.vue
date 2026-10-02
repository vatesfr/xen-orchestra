<template>
  <VtsTabularKeyValueRow :label="t('path-on-share')" :value="sharePath" />
  <VtsTabularKeyValueRow :label="t('username')" :value="urlInfo.username" />
  <VtsTabularKeyValueRow :label="t('password')" :value="maskedPassword" />
  <VtsTabularKeyValueRow :label="t('domain')" :value="urlInfo.domain" />
  <VtsTabularKeyValueRow :label="t('custom-options')" :value="form.formData.customOptions" />
</template>

<script lang="ts" setup>
import type { SmbBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import { maskSecret } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: SmbBackupRepositoryDetailsForm
}>()

const { t } = useI18n()

const urlInfo = computed(() => form.buildPayload().urlInfo)

const maskedPassword = computed(() => maskSecret(urlInfo.value.password))

const sharePath = computed(() => {
  const { host, path } = urlInfo.value

  return `\\\\${host}${path ? `\\${path}` : ''}`
})
</script>
