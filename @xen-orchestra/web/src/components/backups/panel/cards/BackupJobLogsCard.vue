<template>
  <UiCard>
    <UiCardTitle>
      {{ t('last-n-runs', { n: backupLogs.length }) }}
    </UiCardTitle>
    <div class="content">
      <template v-for="(backupRun, index) in backupLogs" :key="backupRun.id">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <span class="subtitle typo-body-bold-small">{{ t('last-run-number', { n: index + 1 }) }}</span>
        <BackupRunItem :backup-run />
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import BackupRunItem from '@/components/backups/panel/card-items/BackupRunItem.vue'
import type { XoBackupLog } from '@/types/xo/backup-log.type.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { backupLogs } = defineProps<{
  backupLogs: XoBackupLog[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .divider {
    margin-block: 1.6rem;
  }
}
</style>
