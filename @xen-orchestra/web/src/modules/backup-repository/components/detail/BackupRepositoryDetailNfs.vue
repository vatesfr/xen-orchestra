<template>
  <UiCard>
    <UiTitle>
      {{ t('nfs') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('host')" :value="nfs.host" />
      <VtsTabularKeyValueRow :label="t('port')" :value="nfs.port" />
      <VtsTabularKeyValueRow :label="t('path-on-share')" :value="nfs.path" />
      <VtsTabularKeyValueRow :label="t('custom-options')" :value="formattedOptions" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { formatMountOptions } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedNfsBackupRepositoryUrl } from 'xo-remote-parser'

const { options } = defineProps<{
  nfs: ParsedNfsBackupRepositoryUrl
  options?: string
}>()

const { t } = useI18n()

const formattedOptions = computed(() => formatMountOptions(options))
</script>
