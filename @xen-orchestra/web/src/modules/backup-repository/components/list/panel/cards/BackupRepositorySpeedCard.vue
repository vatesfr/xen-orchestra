<template>
  <UiPanelCard class="backup-repository-speed-card">
    <UiPanelCardTitle size="medium" :label="t('speed')">
      <template #more-actions>
        <BackupRepositoryBenchmarkButton :br />
      </template>
    </UiPanelCardTitle>

    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('writing-speed') }}</template>
        <template #value>{{ writeSpeed }}</template>
        <template v-if="writeSpeed" #addons>
          <VtsCopyButton :value="writeSpeed" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('reading-speed') }}</template>
        <template #value>{{ readSpeed }}</template>
        <template v-if="readSpeed" #addons>
          <VtsCopyButton :value="readSpeed" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import BackupRepositoryBenchmarkButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryBenchmarkButton.vue'
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { writeSpeed, readSpeed } = useXoBackupRepositoryBenchmark(() => br)
</script>

<style scoped lang="postcss">
.backup-repository-speed-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
