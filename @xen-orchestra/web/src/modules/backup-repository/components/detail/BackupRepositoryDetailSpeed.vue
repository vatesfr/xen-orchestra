<template>
  <UiCard>
    <UiTitle>
      {{ t('speed') }}
      <template #action>
        <BackupRepositoryBenchmarkButton
          :can-benchmark="canBenchmarkBackupRepository"
          :is-benchmarking="isBenchmarkingBackupRepository"
          :error-message="benchmarkBackupRepositoryErrorMessage"
          @click="benchmarkBackupRepository()"
        />
      </template>
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('writing-speed')" :value="writeSpeed" />
      <VtsTabularKeyValueRow :label="t('reading-speed')" :value="readSpeed" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import BackupRepositoryBenchmarkButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryBenchmarkButton.vue'
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
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
