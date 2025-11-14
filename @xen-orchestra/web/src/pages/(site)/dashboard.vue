<template>
  <div class="site-dashboard" :class="{ mobile: uiStore.isMobile }">
    <div class="row first-row">
      <SiteDashboardPoolsStatus class="pools-status" :status="dashboard.poolsStatus" :has-error />
    <SiteDashboardHostsStatus class="hosts-status" :status="dashboard.hostsStatus" :has-error />
      <SiteDashboardVmsStatus class="vms-status" :status="dashboard.vmsStatus" :has-error />
    <SiteDashboardResourcesOverview class="resources-overview" :resources="dashboard.resourcesOverview" :has-error />
    </div>
      <div class="row second-row">
      <DashboardAlarms class="alarms" :alarms :is-ready="areAlarmsReady" :has-error="hasAlarmFetchError" />
      <SiteDashboardPatches
      class="patches"
      :missing-patches="dashboard.missingPatches"
      :n-hosts="dashboard.nHosts"
      :n-hosts-eol="dashboard.nHostsEol"
      :n-pools="dashboard.nPools"
      :has-error
    />
        <BackupJobsStatus class="backup-jobs-status" :backups="dashboard.backups" :has-error />
        <VmsProtection class="vms-protection" :backups="dashboard.backups" :has-error />
        <BackupIssues class="backup-issues" :issues="dashboard.backups?.issues" :has-error />
        <BackupRepository class="backup-repository" :repositories="backupRepositories" :has-error />
        <StorageRepository class="storage-repository" :repositories="storageRepositories" :has-error />
        <S3BackupRepository class="s3-backup-repository" :size="dashboard.backupRepositories?.s3?.size" :has-error />
      </div>
  </div>
</template>

<script lang="ts" setup>
import DashboardAlarms from '@/modules/alarm/components/DashboardAlarms.vue'
import { useXoAlarmCollection } from '@/modules/alarm/remote-resources/use-xo-alarm-collection.ts'
import SiteDashboardBackupIssues from '@/modules/site/components/dashboard/SiteDashboardBackupIssues.vue'
import SiteDashboardBackups from '@/modules/site/components/dashboard/SiteDashboardBackups.vue'
import SiteDashboardHostsStatus from '@/modules/site/components/dashboard/SiteDashboardHostsStatus.vue'
import SiteDashboardPatches from '@/modules/site/components/dashboard/SiteDashboardPatches.vue'
import SiteDashboardPoolsStatus from '@/modules/site/components/dashboard/SiteDashboardPoolsStatus.vue'
import SiteDashboardRepositories from '@/modules/site/components/dashboard/SiteDashboardRepositories.vue'
import SiteDashboardResourcesOverview from '@/modules/site/components/dashboard/SiteDashboardResourcesOverview.vue'
import SiteDashboardVmsStatus from '@/modules/site/components/dashboard/SiteDashboardVmsStatus.vue'
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'

const uiStore = useUiStore()

const { dashboard, backupRepositories, storageRepositories, hasError } = useXoSiteDashboard()

const { alarms, hasAlarmFetchError } = useXoAlarmCollection()

const { areHostsReady } = useXoHostCollection()
const { areVmsReady } = useXoVmCollection()
const { areVmControllersReady } = useXoVmControllerCollection()
const { areSrsReady } = useXoSrCollection()

const areAlarmsReady = logicAnd(areHostsReady, areVmsReady, areVmControllersReady, areSrsReady)
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
      'backup-jobs-status vms-protection backup-issues'
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

  .vms-protection {
    grid-area: vms-protection;
  }

  .backup-issues {
    grid-area: backup-issues;
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
