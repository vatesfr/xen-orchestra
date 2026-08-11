<template>
  <UiCard class="card-container">
    <UiCardTitle>{{ t('nfs') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('host') }}</template>
        <template #value>{{ nfsInfo.host }}</template>
        <template #addons>
          <VtsCopyButton :value="nfsInfo.host" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue v-if="nfsInfo.port !== undefined">
        <template #key>{{ t('port') }}</template>
        <template #value>{{ nfsInfo.port }}</template>
        <template #addons>
          <VtsCopyButton :value="nfsInfo.port" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('path-on-share') }}</template>
        <template #value>{{ nfsInfo.path }}</template>
        <template #addons>
          <VtsCopyButton :value="nfsInfo.path" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { getBackupRepositoryNfsInfo } from '@/modules/backup/components/utils/xo-backup-repository.utils.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const nfsInfo = computed(() => getBackupRepositoryNfsInfo(br.url))
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
