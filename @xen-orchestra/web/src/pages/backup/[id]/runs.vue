<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <BackupLogsTable :backup-logs :has-error="hasBackupLogFetchError" :is-ready="areBackupLogsReady" />
    </UiCard>
    <BackupLogsSidePanel
      v-if="selectedBackupLog"
      :backup-log="selectedBackupLog"
      @close="selectedBackupLog = undefined"
    />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import BackupLogsTable from '@/components/backups/logs/BackupLogsTable.vue'
import BackupLogsSidePanel from '@/components/backups/logs/panel/BackupLogsSidePanel.vue'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import type { AnyXoBackupJob, XoBackupLog } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: AnyXoBackupJob
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { backupLogsByJobId, hasBackupLogFetchError, areBackupLogsReady } = useXoBackupLogCollection()

const backupLogs = computed(() => backupLogsByJobId.value.get(backupJob.id) ?? [])

const selectedBackupLog = useRouteQuery<XoBackupLog | undefined>('id', {
  toData: id => backupLogs.value.find(backupLog => backupLog.id === id),
  toQuery: backupLog => backupLog?.id ?? '',
})
</script>

<style scoped lang="postcss">
.backups {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
