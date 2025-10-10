<template>
  <UiCard class="backup-jobs-information">
    <UiTitle> {{ t('general-information') }} </UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('name')" :value="backupJob.name" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('id')" :value="backupJob.id" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('mode')">
          <template #value>
            <UiTag variant="secondary" accent="info">
              {{ backupJob.mode }}
            </UiTag>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
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
.backup-jobs-information {
  width: 100%;
}
</style>
