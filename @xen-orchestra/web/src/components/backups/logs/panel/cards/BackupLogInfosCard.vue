<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="backupLog.id !== undefined" size="small" icon="object:backup-log">
        {{ backupLog.id }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <UiLabelValue :label="t('id')" :value="backupLog.id" :copy-value="backupLog.id" ellipsis />
      <UiLabelValue :label="t('start-date')" :value="formattedStartDate" :copy-value="formattedStartDate" ellipsis />
      <UiLabelValue :label="t('end-date')" :value="formattedEndDate" :copy-value="formattedEndDate" ellipsis />
      <UiLabelValue :label="t('duration')" :value="duration" :copy-value="duration" ellipsis />
      <UiLabelValue :label="t('status')">
        <template #value>
          <VtsStatus :status="backupLog.status" />
        </template>
      </UiLabelValue>
      <UiLabelValue
        :label="t('transfer-size')"
        :value="transferSize ? `${transferSize.value} ${transferSize.prefix}` : undefined"
      />
      <UiLabelValue v-if="backupLog.tasks !== undefined && backupLog.tasks.length > 0" :label="t('task')">
        <template #value>
          <!-- TODO: add link to task when Tasks page will be available -->
          <UiLink size="small">{{ backupLog.tasks[0].id }}</UiLink>
        </template>
      </UiLabelValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupLogsUtils } from '@/composables/xo-backup-log-utils.composable'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{
  backupLog: XoBackupLog
}>()

const { t } = useI18n()

const { getBackupLogDate, getBackupLogDuration, getTransferSize } = useXoBackupLogsUtils()

const formattedStartDate = computed(() => getBackupLogDate(backupLog.start))
const formattedEndDate = computed(() => getBackupLogDate(backupLog.end))

const duration = computed(() => getBackupLogDuration(backupLog))

const transferSize = computed(() => getTransferSize(backupLog))
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
