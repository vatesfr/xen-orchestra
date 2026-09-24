<template>
  <UiPanelCard class="backup-repository-azure-azurite-card">
    <UiCardTitle v-if="azure.type === 'azure'">{{ t('azure') }}</UiCardTitle>
    <UiCardTitle v-else>{{ t('azurite') }}</UiCardTitle>
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
        <template #value>{{ splitPath.root }}</template>
        <template #addons>
          <VtsCopyButton :value="splitPath.root" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('path') }}</template>
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
import type { ParsedAzureBackupRepositoryUrl } from 'xo-remote-parser'

const { azure } = defineProps<{
  azure: ParsedAzureBackupRepositoryUrl
}>()

const { t } = useI18n()

const splitPath = computed(() => splitBackupRepositoryPath(azure.path))
</script>

<style scoped lang="postcss">
.backup-repository-azure-azurite-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
