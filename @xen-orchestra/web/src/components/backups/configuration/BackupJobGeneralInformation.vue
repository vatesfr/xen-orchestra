<template>
  <UiCard class="backup-job-information">
    <UiTitle> {{ t('general-information') }} </UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('name')" :value="backupJob.name" />
        </VtsQuickInfoColumn>
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('id')" :value="backupJob.id" />
        </VtsQuickInfoColumn>
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('mode')">
            <template #value>
              <UiTag variant="secondary" accent="info">
                {{ backupJob.mode }}
              </UiTag>
            </template>
          </VtsQuickInfoRow>
        </VtsQuickInfoColumn>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
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
.backup-job-information {
  width: 100%;
}
</style>
