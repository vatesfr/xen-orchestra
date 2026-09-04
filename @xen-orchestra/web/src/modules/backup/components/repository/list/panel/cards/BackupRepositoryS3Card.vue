<template>
  <UiPanelCard class="card-container">
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
        <template #value>{{ bucket }}</template>
        <template #addons>
          <VtsCopyButton :value="bucket" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('path-in-bucket') }}</template>
        <template #value>{{ pathInBucket }}</template>
        <template #addons>
          <VtsCopyButton :value="pathInBucket" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { ParsedS3BackupRepositoryUrl } from '@/modules/backup/types/xo-backup-repository.type.ts'
import { MASKED_SECRET } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { s3 } = defineProps<{
  s3: ParsedS3BackupRepositoryUrl
}>()

const ACCESS_KEY_ID_LIMIT = 20

const { t } = useI18n()

const bucket = computed(() => s3.path.replace(/^\/+/, '').split('/')[0] ?? '')

const pathInBucket = computed(() => `/${s3.path.replace(/^\/+/, '').split('/').slice(1).join('/')}`)

const truncatedAccessKeyId = computed(() =>
  s3.username.length > ACCESS_KEY_ID_LIMIT ? `${s3.username.slice(0, ACCESS_KEY_ID_LIMIT)}…` : s3.username
)
</script>

<style scoped lang="postcss">
.card-container {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
