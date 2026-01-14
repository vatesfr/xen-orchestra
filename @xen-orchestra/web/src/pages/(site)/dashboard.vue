<template>
  <div class="site-dashboard" :class="{ mobile: uiStore.isMobile }">
    <div class="row first-row">
      <SiteDashboardPoolsStatus class="pools-status" />
      <SiteDashboardHostsStatus class="hosts-status" />
      <SiteDashboardVmsStatus class="vms-status" />
      <SiteDashboardResourcesOverview class="resources-overview" />
    </div>
    <div class="row second-row">
      <DashboardAlarms class="alarms" />
      <SiteDashboardPatches class="patches" />
      <SiteDashboardBackupJobsStatus class="backup-jobs-status" />
      <SiteDashboardBackupIssues class="backup-issues" />
      <SiteDashboardVmsProtection class="vms-protection" />
      <SiteDashboardBackupRepository class="backup-repository" />
      <SiteDashboardStorageRepository class="storage-repository" />
      <SiteDashboardS3BackupRepository class="s3-backup-repository" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import DashboardAlarms from '@/modules/alarm/components/DashboardAlarms.vue'
import SiteDashboardBackupIssues from '@/modules/site/components/dashboard/SiteDashboardBackupIssues.vue'
import SiteDashboardBackupJobsStatus from '@/modules/site/components/dashboard/SiteDashboardBackupJobsStatus.vue'
import SiteDashboardBackupRepository from '@/modules/site/components/dashboard/SiteDashboardBackupRepository.vue'
import SiteDashboardHostsStatus from '@/modules/site/components/dashboard/SiteDashboardHostsStatus.vue'
import SiteDashboardPatches from '@/modules/site/components/dashboard/SiteDashboardPatches.vue'
import SiteDashboardPoolsStatus from '@/modules/site/components/dashboard/SiteDashboardPoolsStatus.vue'
import SiteDashboardResourcesOverview from '@/modules/site/components/dashboard/SiteDashboardResourcesOverview.vue'
import SiteDashboardS3BackupRepository from '@/modules/site/components/dashboard/SiteDashboardS3BackupRepository.vue'
import SiteDashboardStorageRepository from '@/modules/site/components/dashboard/SiteDashboardStorageRepository.vue'
import SiteDashboardVmsProtection from '@/modules/site/components/dashboard/SiteDashboardVmsProtection.vue'
import SiteDashboardVmsStatus from '@/modules/site/components/dashboard/SiteDashboardVmsStatus.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.site-dashboard {
  margin: 0.8rem;

  /* === DESKTOP === */
  .row {
    display: grid;
    gap: 0.8rem;
  }

  .row + .row {
    margin-top: 0.8rem;
  }

  .first-row {
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas: 'pools-status hosts-status vms-status resources-overview';
  }

  .second-row {
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas:
      'alarms alarms patches'
      'backup-jobs-status backup-issues vms-protection'
      'backup-repository storage-repository s3-backup-repository';
  }

  .pools-status {
    grid-area: pools-status;
  }

  .hosts-status {
    grid-area: hosts-status;
  }

  .vms-status {
    grid-area: vms-status;
  }

  .alarms {
    grid-area: alarms;
    max-height: 40.6rem;
  }

  .patches {
    grid-area: patches;
  }

  .resources-overview {
    grid-area: resources-overview;
  }

  .backup-jobs-status {
    grid-area: backup-jobs-status;
  }

  .backup-issues {
    grid-area: backup-issues;
  }

  .vms-protection {
    grid-area: vms-protection;
  }

  .backup-repository {
    grid-area: backup-repository;
  }

  .storage-repository {
    grid-area: storage-repository;
  }

  .s3-backup-repository {
    grid-area: s3-backup-repository;
  }

  /* === MOBILE === */
  &.mobile {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  &.mobile .row {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 0;
  }
}
</style>
