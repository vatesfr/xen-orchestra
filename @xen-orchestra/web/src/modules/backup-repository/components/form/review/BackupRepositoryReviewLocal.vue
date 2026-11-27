<template>
  <VtsTabularKeyValueRow :label="t('path')" :value="form.formData.path" />
</template>

<script lang="ts" setup>
import type { LocalBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  form: LocalBackupRepositoryDetailsForm
}>()

const { t } = useI18n()
</script>
