<template>
  <UiPanelCard class="backup-repository-speed-card">
    <UiPanelCardTitle size="medium" :label="t('speed')">
      <template #more-actions>
        <UiButtonIcon
          v-tooltip="canBenchmark ? t('click-test-br-speed') : benchmarkErrorMessage"
          :icon="isBenchmarking ? 'fa:spinner' : 'action:scan'"
          :disabled="!canBenchmark"
          accent="brand"
          size="small"
          @click="runBenchmark()"
        />
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
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { writeSpeed, readSpeed, runBenchmark, canBenchmark, isBenchmarking, benchmarkErrorMessage } =
  useXoBackupRepositoryBenchmark(() => br)
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
