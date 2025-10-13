<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="backupLog.id !== undefined" size="small" icon="object:backup-log">
        {{ backupLog.id }}
      </UiLink>
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
          <VtsBackupState :state="backupLog.status" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('transfer-size') }}</template>
        <template v-if="transferSize !== undefined" #value>{{ transferSize.value }} {{ transferSize.prefix }}</template>
        <template v-else #value />
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupLogsUtils } from '@/composables/xo-backup-log-utils.composable'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
import VtsBackupState from '@core/components/backup-state/VtsBackupState.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
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
