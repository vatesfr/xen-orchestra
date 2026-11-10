<template>
  <UiCard>
    <UiTitle>
      {{ t('s3') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('endpoint-url')" :value="s3.host" />
      <VtsTabularKeyValueRow :label="t('https')">
        <template #value>
          <VtsStatus :status="s3.protocol === 'https'" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('accept-self-signed-certificates')">
        <template #value>
          <VtsStatus :status="s3.allowUnauthorized === true" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('region')" :value="s3.region" />
      <VtsTabularKeyValueRow :label="t('access-key-id')" :value="s3.username" />
      <VtsTabularKeyValueRow :label="t('secret')" :value="MASKED_SECRET" />
      <VtsTabularKeyValueRow :label="t('bucket-name')" :value="splitPath.root" />
      <VtsTabularKeyValueRow :label="t('path-in-bucket')" :value="splitPath.subPath" />
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
import type { ParsedS3BackupRepositoryUrl } from 'xo-remote-parser'

const { s3 } = defineProps<{
  s3: ParsedS3BackupRepositoryUrl
}>()

const { t } = useI18n()

const splitPath = computed(() => splitBackupRepositoryPath(s3.path))
</script>
