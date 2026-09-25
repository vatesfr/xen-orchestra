<template>
  <UiCard>
    <UiTitle>
      {{ t('smb') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('path-on-share')" :value="pathOnShare" />
      <VtsTabularKeyValueRow :label="t('username')" :value="smb.username" />
      <VtsTabularKeyValueRow v-if="smb.password !== ''" :label="t('password')" :value="MASKED_SECRET" />
      <VtsTabularKeyValueRow :label="t('domain')" :value="smb.domain" />
      <VtsTabularKeyValueRow :label="t('custom-options')" :value="formattedOptions" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { formatMountOptions, MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedSmbBackupRepositoryUrl } from 'xo-remote-parser'

const { smb, options } = defineProps<{
  smb: ParsedSmbBackupRepositoryUrl
  options?: string
}>()

const { t } = useI18n()

const pathOnShare = computed(() => `\\\\${smb.host}${smb.path !== '' ? `\\${smb.path}` : ''}`)

const formattedOptions = computed(() => formatMountOptions(options))
</script>
