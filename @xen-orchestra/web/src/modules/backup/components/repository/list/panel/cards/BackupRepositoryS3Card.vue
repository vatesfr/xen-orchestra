<template>
  <UiPanelCard class="backup-repository-s3-card">
    <UiCardTitle>{{ t('s3') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('endpoint-url') }}</template>
        <template #value>{{ s3.host }}</template>
        <template #addons>
          <VtsCopyButton :value="s3.host" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('https') }}</template>
        <template #value>
          <VtsStatus :status="s3.protocol === 'https'" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('accept-self-signed-certificates') }}</template>
        <template #value>
          <VtsStatus :status="s3.allowUnauthorized === true" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('region') }}</template>
        <template #value>{{ s3.region }}</template>
        <template v-if="s3.region" #addons>
          <VtsCopyButton :value="s3.region" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('access-key-id') }}</template>
        <template #value>{{ truncatedAccessKeyId }}</template>
        <template #addons>
          <VtsCopyButton :value="s3.username" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('secret') }}</template>
        <template #value>{{ MASKED_SECRET }}</template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('bucket-name') }}</template>
        <template #value>{{ splitPath.root }}</template>
        <template #addons>
          <VtsCopyButton :value="splitPath.root" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('path-in-bucket') }}</template>
        <template #value>{{ splitPath.subPath }}</template>
        <template #addons>
          <VtsCopyButton :value="splitPath.subPath" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { MASKED_SECRET, splitBackupRepositoryPath } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedS3BackupRepositoryUrl } from 'xo-remote-parser'

const { s3 } = defineProps<{
  s3: ParsedS3BackupRepositoryUrl
}>()

const ACCESS_KEY_ID_LIMIT = 20

const { t } = useI18n()

const splitPath = computed(() => splitBackupRepositoryPath(s3.path))

const truncatedAccessKeyId = computed(() =>
  s3.username.length > ACCESS_KEY_ID_LIMIT ? `${s3.username.slice(0, ACCESS_KEY_ID_LIMIT)}…` : s3.username
)
</script>

<style scoped lang="postcss">
.backup-repository-s3-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
