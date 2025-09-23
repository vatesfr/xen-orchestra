<template>
  <UiCard class="backupJobConfiguration">
    <UiTitle> {{ t('general-information') }} </UiTitle>
    <span>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :label="t('name')" :value="backupJob.name" />
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :label="t('id')" :value="backupJob.id" />
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :label="t('mode')" :value="backupJob.mode">
          <template #value>
            <UiTag variant="secondary" accent="info">
              {{ backupJob.mode }}
            </UiTag>
          </template></VtsQuickInfoRow
        >
      </VtsQuickInfoColumn>
    </span>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backupJobConfiguration {
  width: 100%;
  span {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }
}
</style>
