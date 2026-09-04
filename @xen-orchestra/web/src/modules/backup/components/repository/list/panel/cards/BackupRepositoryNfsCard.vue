<template>
  <UiCard class="card-container">
    <UiCardTitle>{{ t('nfs') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('host') }}</template>
        <template #value>{{ nfs.host }}</template>
        <template #addons>
          <VtsCopyButton :value="nfs.host" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue v-if="nfs.port" truncate align-top>
        <template #key>{{ t('port') }}</template>
        <template #value>{{ nfs.port }}</template>
        <template #addons>
          <VtsCopyButton :value="nfs.port" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('path-on-share') }}</template>
        <template #value>{{ nfs.path }}</template>
        <template #addons>
          <VtsCopyButton :value="nfs.path" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { type NfsBackupRepositoryInfo } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  nfs: NfsBackupRepositoryInfo
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
