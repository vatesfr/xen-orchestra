<template>
  <VtsActionButton
    :hint="benchmarkBackupRepositoryErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:scan"
    :disabled="!canBenchmarkBackupRepository"
    :busy="isBenchmarkingBackupRepository"
    @click="benchmarkBackupRepository()"
  >
    {{ t('action:test-speed') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
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
</script>
