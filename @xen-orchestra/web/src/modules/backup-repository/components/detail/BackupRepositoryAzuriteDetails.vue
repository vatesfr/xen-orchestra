<template>
  <UiCard>
    <UiTitle>
      {{ t('azurite') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('host')" :value="azurite.host" />
      <VtsTabularKeyValueRow :label="t('https')">
        <template #value>
          <VtsStatus :status="azurite.protocol === 'https'" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('account-name')" :value="azurite.username" />
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
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedAzureBackupRepositoryUrl } from 'xo-remote-parser'

const { azurite } = defineProps<{
  azurite: ParsedAzureBackupRepositoryUrl
}>()

const { t } = useI18n()

const splitPath = computed(() => splitBackupRepositoryPath(azurite.path))
</script>
