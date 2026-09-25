<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="br.name" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="br.id" />
      <VtsTabularKeyValueRow :label="t('status')">
        <template #value>
          <VtsStatus :status="brStatus" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('type')" :value="brType" />
      <VtsTabularKeyValueRow :label="t('backup-format')" :value="brStorageMode" />
      <VtsTabularKeyValueRow :label="t('proxy')">
        <template v-if="brProxy" #value>
          <VtsIcon size="medium" name="object:proxy" />
          {{ brProxy.name }}
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('encryption')">
        <template #value>
          <VtsStatus :status="isEncrypted" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryStatus } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedBackupRepositoryUrl } from 'xo-remote-parser'

const { br, parsedBrUrl } = defineProps<{
  br: FrontXoBackupRepository
  parsedBrUrl: ParsedBackupRepositoryUrl | undefined
}>()

const { t } = useI18n()

const { useGetProxyById } = useXoProxyCollection()

const brStatus = computed(() => getBackupRepositoryStatus(br))

const brType = useXoBackupRepositoryTypeLabel(() => parsedBrUrl?.type)

const brStorageMode = computed(() => {
  if (parsedBrUrl?.type === undefined) {
    return t('unknown')
  }

  return parsedBrUrl.useVhdDirectory ? t('block-based') : t('file-based')
})

const brProxy = useGetProxyById(() => br.proxy)

const isEncrypted = computed(() => parsedBrUrl?.encryptionKey !== undefined)
</script>
