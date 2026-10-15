<template>
  <UiPanelCard class="admin-backup-log-size-and-speed-card">
    <UiPanelCardTitle size="medium" :label="t('size-and-speed')" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('size') }}</template>
        <template #value>{{ size }}</template>
        <template v-if="size !== undefined" #addons>
          <VtsCopyButton :value="size" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('speed') }}</template>
        <template #value>{{ speed }}</template>
        <template v-if="speed !== undefined" #addons>
          <VtsCopyButton :value="speed" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupLogsUtils } from '@/modules/backup/composables/xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{
  backupLog: FrontXoBackupLog
}>()

const { t } = useI18n()

const { getTransferSize, getTransferSpeed } = useXoBackupLogsUtils()

const size = computed(() => {
  const transferSize = getTransferSize(backupLog)

  return transferSize !== undefined ? `${transferSize.value} ${transferSize.prefix}` : undefined
})

const speed = computed(() => {
  const transferSpeed = getTransferSpeed(backupLog)

  return transferSpeed !== undefined ? `${transferSpeed.value} ${transferSpeed.prefix}` : undefined
})
</script>

<style scoped lang="postcss">
.admin-backup-log-size-and-speed-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
