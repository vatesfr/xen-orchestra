<template>
  <UiCard>
    <UiTitle>{{ t('general-information') }}</UiTitle>
    <VtsColumns>
      <VtsColumn>
        <UiLabelValue :label="t('name')" :value="backupJob.name" />
      </VtsColumn>
      <VtsColumn>
        <UiLabelValue :label="t('id')" :value="backupJob.id" />
      </VtsColumn>
      <VtsColumn>
        <UiLabelValue :label="t('mode')" :value="modeLabels" />
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()

const { getModeLabels } = useXoBackupUtils()

const modeLabels = computed(() => getModeLabels(backupJob))
</script>
