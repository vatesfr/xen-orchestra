<template>
  <UiPanelCard class="card-container">
    <UiCardTitle>{{ t(azure.type) }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('host') }}</template>
        <template #value>{{ azure.host }}</template>
        <template #addons>
          <VtsCopyButton :value="azure.host" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue v-if="azure.type === 'azurite'">
        <template #key>{{ t('https') }}</template>
        <template #value>
          <VtsStatus :status="azure.protocol === 'https'" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('account-name') }}</template>
        <template #value>{{ azure.username }}</template>
        <template #addons>
          <VtsCopyButton :value="azure.username" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('key') }}</template>
        <template #value>{{ MASKED_SECRET }}</template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('container-name') }}</template>
        <template #value>{{ container }}</template>
        <template #addons>
          <VtsCopyButton :value="container" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('path') }}</template>
        <template #value>{{ pathInContainer }}</template>
        <template #addons>
          <VtsCopyButton :value="pathInContainer" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { type AzureBackupRepositoryInfo } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { MASKED_SECRET } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { azure } = defineProps<{
  azure: AzureBackupRepositoryInfo
}>()

const { t } = useI18n()

const container = computed(() => azure.path.replace(/^\/+/, '').split('/')[0] ?? '')

const pathInContainer = computed(() => `/${azure.path.replace(/^\/+/, '').split('/').slice(1).join('/')}`)
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
