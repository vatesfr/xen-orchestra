<template>
  <UiCard>
    <UiTitle>
      {{ t('speed') }}
      <template #action>
        <UiButtonIcon
          v-tooltip="canBenchmark ? t('click-test-br-speed') : benchmarkErrorMessage"
          :icon="isBenchmarking ? 'fa:spinner' : 'action:scan'"
          :disabled="!canBenchmark"
          accent="brand"
          size="small"
          @click="runBenchmark()"
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
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { benchmark, runBenchmark, canBenchmark, isBenchmarking, benchmarkErrorMessage } = useXoBackupRepositoryBenchmark(
  () => br
)

const writeSpeed = computed(() => (benchmark.value === undefined ? undefined : formatSpeed(benchmark.value.writeRate)))

const readSpeed = computed(() => (benchmark.value === undefined ? undefined : formatSpeed(benchmark.value.readRate)))
</script>
