<template>
  <UiPanelCard class="backup-repository-speed-card">
    <UiCardTitle>
      {{ t('speed') }}
      <template #info>
        <UiButtonIcon
          v-tooltip="canBenchmarkBackupRepository ? t('click-test-br-speed') : benchmarkBackupRepositoryErrorMessage"
          :icon="isBenchmarkingBackupRepository ? 'fa:spinner' : 'action:scan'"
          :disabled="!canBenchmarkBackupRepository"
          accent="brand"
          size="small"
          @click="benchmarkBackupRepository()"
        />
      </template>
    </UiCardTitle>

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
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const {
  run: benchmarkBackupRepository,
  canRun: canBenchmarkBackupRepository,
  isRunning: isBenchmarkingBackupRepository,
  errorMessage: benchmarkBackupRepositoryErrorMessage,
} = useXoBackupRepositoryBenchmarkJob(() => [br])

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
