<template>
  <UiCard class="card-container">
    <VtsCardObjectTitle :id="backupJob.id" :label="backupJob.name" icon="object:backup-job" />
    <div class="content">
      <VtsCardRowKeyValue v-for="(mode, index) in backupJobModes" :key="mode">
        <template #key>
          <template v-if="index === 0">{{ t('mode', backupJobModes.length) }}</template>
        </template>
        <template #value>{{ mode }}</template>
        <template #addons>
          <VtsCopyButton :value="mode" />
          <UiButtonIcon
            v-if="index === 0 && backupJobModes.length > 1"
            v-tooltip="t('coming-soon!')"
            disabled
            icon="fa:ellipsis"
            size="small"
            accent="brand"
          />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupUtils } from '@/modules/backup/composables/xo-backup-utils.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const { getModeLabels } = useXoBackupUtils()

const backupJobModes = computed(() => getModeLabels(backupJob).filter(mode => mode))
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
