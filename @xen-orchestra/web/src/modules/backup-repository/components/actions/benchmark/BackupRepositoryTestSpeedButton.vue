<template>
  <MenuItem
    v-tooltip="!canBenchmarkBackupRepository && benchmarkBackupRepositoryErrorMessage"
    accent="neutral"
    icon="action:scan"
    :disabled="!canBenchmarkBackupRepository"
    :busy="isBenchmarkingBackupRepository"
    @click="benchmarkBackupRepository()"
  >
    {{ t('action:test-speed') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
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
</script>
