<template>
  <UiPanelCard class="backup-repository-speed-card">
    <UiCardTitle>
      {{ t('speed') }}
      <template #info>
        <UiButtonIcon
          v-tooltip="canBenchmark ? t('click-test-br-speed') : benchmarkErrorMessage"
          :icon="isBenchmarking ? 'fa:spinner' : 'action:scan'"
          :disabled="!canBenchmark"
          accent="brand"
          size="small"
          @click="runBenchmark()"
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
import { useXoBackupRepositoryBenchmark } from '@/modules/backup/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
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

<style scoped lang="postcss">
.backup-repository-speed-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
