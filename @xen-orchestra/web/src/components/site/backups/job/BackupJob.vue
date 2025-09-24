<template>
  <template v-if="selectedBackupJob == undefined">
    <VtsStateHero format="page" size="large" type="no-data" />
  </template>
  <template v-else>
    <BackupsHeader :backup-name="selectedBackupJob.name" />
    <span class="backup-job">
      <span>
        <BackupjobMenu />
      </span>
      <BackupjobConfiguration :backup-job="selectedBackupJob" />
    </span>
  </template>
</template>

<script setup lang="ts">
import BackupsHeader from '@/components/site/backups/backupsHeader.vue'
import BackupjobMenu from '@/components/site/backups/job/BackupJobMenu.vue'
import BackupjobConfiguration from '@/components/site/backups/job/configuration/BackupJobConfiguration.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'

const selectedBackupJobId = useRouteQuery('id')
const { backupJobs } = useXoBackupJobCollection()

const selectedBackupJob = computed(() => {
  return backupJobs.value.find(job => job.id === selectedBackupJobId.value)
})
</script>

<style lang="postcss" scoped>
.backup-job {
  display: flex;
  width: 100%;
  margin: 0.8rem;
  gap: 0.8rem;
}
</style>
