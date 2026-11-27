<template>
  <VtsTabularKeyValueRow :label="t('host')" :value="urlInfo.host" />
  <VtsTabularKeyValueRow :label="t('port')" :value="urlInfo.port" />
  <VtsTabularKeyValueRow :label="t('path-on-share')" :value="urlInfo.path" />
  <VtsTabularKeyValueRow :label="t('custom-options')" :value="form.formData.customOptions" />
</template>

<script lang="ts" setup>
import type { NfsBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: NfsBackupRepositoryDetailsForm
}>()

const { t } = useI18n()

const urlInfo = computed(() => form.buildPayload().urlInfo)
</script>
