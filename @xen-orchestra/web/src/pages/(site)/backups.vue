<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs :busy="!areBackupJobsReady" :error="hasBackupJobFetchError" />
    </UiCard>
    <BackupJobSidePanel
      v-if="selectedBackupJob"
      :backup-job="selectedBackupJob"
      @close="selectedBackupJob = undefined"
    />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup/components/jobs/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup/components/jobs/panel/BackupJobSidePanel.vue'
import {
  useXoBackupJobCollection,
  type FrontAnyXoBackupJob,
} from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()

const { backupJobs, getBackupJobById, areBackupJobsReady, hasBackupJobFetchError } = useXoBackupJobCollection()

const { t } = useI18n()

const selectedBackupJob = useRouteQuery<FrontAnyXoBackupJob | undefined>('id', {
  toData: id => getBackupJobById(id as FrontAnyXoBackupJob['id']),
  toQuery: backupJob => backupJob?.id ?? '',
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
