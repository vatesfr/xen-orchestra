<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs :has-error="hasBackupJobFetchError" />
    </UiCard>
    <BackupJobsSidePanel
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
import BackupJobsTable from '@/components/backups/jobs/BackupJobsTable.vue'
import BackupJobsSidePanel from '@/components/backups/jobs/panel/BackupJobsSidePanel.vue'
import { useXoBackupJobCollection, type XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()

const { backupJobs, hasBackupJobFetchError, getBackupJobById } = useXoBackupJobCollection()

const { t } = useI18n()

const { t } = useI18n()

const selectedBackupJob = useRouteQuery<XoBackupJob | undefined>('id', {
  toData: id => getBackupJobById(id as XoBackupJob['id']),
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
