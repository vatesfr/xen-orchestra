<template>
  <MenuItem
    v-tooltip="!canBenchmark && benchmarkErrorMessage"
    accent="neutral"
    icon="action:scan"
    :disabled="!canBenchmark"
    :busy="isBenchmarking"
    @click="runBenchmark()"
  >
    {{ t('action:test-speed') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { runBenchmark, canBenchmark, isBenchmarking, benchmarkErrorMessage } = useXoBackupRepositoryBenchmark(() => br)
</script>
