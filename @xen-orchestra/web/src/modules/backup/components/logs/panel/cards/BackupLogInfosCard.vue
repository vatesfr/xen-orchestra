<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <span v-if="backupLog.id !== undefined" class="backup-log-id">
        <VtsIcon size="current" name="object:backup-run" />
        {{ backupLog.id }}
      </span>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('id') }}</template>
        <template #value>{{ backupLog.id }}</template>
        <template #addons>
          <VtsCopyButton :value="backupLog.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('start-date') }}</template>
        <template #value>{{ formattedStartDate }}</template>
        <template v-if="formattedStartDate !== undefined" #addons>
          <VtsCopyButton :value="formattedStartDate" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('end-date') }}</template>
        <template #value>{{ formattedEndDate }}</template>
        <template v-if="formattedEndDate !== undefined" #addons>
          <VtsCopyButton :value="formattedEndDate" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('duration') }}</template>
        <template #value>{{ duration }}</template>
        <template v-if="duration !== undefined" #addons>
          <VtsCopyButton :value="duration" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="backupLog.status" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('transfer-size') }}</template>
        <template v-if="transferSize !== undefined" #value>{{ transferSize.value }} {{ transferSize.prefix }}</template>
        <template v-else #value />
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="backupLog.tasks !== undefined && backupLog.tasks.length > 0">
        <template #key>{{ t('task') }}</template>
        <template #value>
          <!-- TODO: add link to task when Tasks page will be available -->
          <UiLink size="small">{{ backupLog.tasks[0].id }}</UiLink>
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupLogsUtils } from '@/modules/backup/composables/xo-backup-log-utils.composable.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoBackupLog } from '@vates/types'
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

  .backup-log-id {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
