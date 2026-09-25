<template>
  <UiCard>
    <UiTitle>
      {{ t('azure') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('host')" :value="azure.host" />
      <VtsTabularKeyValueRow :label="t('account-name')" :value="azure.username" />
      <VtsTabularKeyValueRow :label="t('key')" :value="MASKED_SECRET" />
      <VtsTabularKeyValueRow :label="t('container-name')" :value="splitPath.root" />
      <VtsTabularKeyValueRow :label="t('path')" :value="splitPath.subPath" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import {
  MASKED_SECRET,
  splitBackupRepositoryPath,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedAzureBackupRepositoryUrl } from 'xo-remote-parser'

const { azure } = defineProps<{
  azure: ParsedAzureBackupRepositoryUrl
}>()

const { t } = useI18n()

const splitPath = computed(() => splitBackupRepositoryPath(azure.path))
</script>
