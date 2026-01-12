<template>
  <div class="site-dashboard" :class="{ mobile: uiStore.isMobile }">
    <div class="row first-row">
      <PoolsStatus class="pools-status" :status="dashboard.poolsStatus" :has-error :is-ready="isDashboardReady" />
      <HostsStatus class="hosts-status" :status="dashboard.hostsStatus" :has-error :is-ready="isDashboardReady" />
      <VmsStatus class="vms-status" :status="dashboard.vmsStatus" :has-error :is-ready="isDashboardReady" />
      <ResourcesOverview
        class="resources-overview"
        :resources="dashboard.resourcesOverview"
        :has-error
        :is-ready="isDashboardReady"
      />
    </div>
    <div class="row second-row">
      <DashboardAlarms class="alarms" :alarms :is-ready="areAlarmsReady" :has-error="hasAlarmFetchError" />
      <Patches
        class="patches"
        :missing-patches="dashboard.missingPatches"
        :n-hosts="dashboard.nHosts"
        :n-hosts-eol="dashboard.nHostsEol"
        :n-pools="dashboard.nPools"
        :has-error
      />
      <BackupJobsStatus
        class="backup-jobs-status"
        :backups="dashboard.backups"
        :has-error:is-ready="isDashboardReady"
      />
      <BackupIssues class="backup-issues" :backups="dashboard.backups" :has-error:is-ready="isDashboardReady" />
      <VmsProtection class="vms-protection" :backups="dashboard.backups" :has-error :is-ready="isDashboardReady" />
      <BackupRepository
        class="backup-repository"
        :repositories="backupRepositories"
        :has-error
        :is-ready="isDashboardReady"
      />
      <StorageRepository
        class="storage-repository"
        :repositories="storageRepositories"
        :has-error:is-ready="isDashboardReady"
      />
      <S3BackupRepository
        class="s3-backup-repository"
        :size="dashboard.backupRepositories?.s3?.size"
        :has-error
        :is-ready="isDashboardReady"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import DashboardAlarms from '@/components/alarms/DashboardAlarms.vue'
import BackupIssues from '@/components/site/dashboard/BackupIssues.vue'
import BackupJobsStatus from '@/components/site/dashboard/BackupJobsStatus.vue'
import BackupRepository from '@/components/site/dashboard/BackupRepository.vue'
import HostsStatus from '@/components/site/dashboard/HostsStatus.vue'
import Patches from '@/components/site/dashboard/Patches.vue'
import PoolsStatus from '@/components/site/dashboard/PoolsStatus.vue'
import ResourcesOverview from '@/components/site/dashboard/ResourcesOverview.vue'
import S3BackupRepository from '@/components/site/dashboard/S3BackupRepository.vue'
import StorageRepository from '@/components/site/dashboard/StorageRepository.vue'
import VmsProtection from '@/components/site/dashboard/VmsProtection.vue'
import VmsStatus from '@/components/site/dashboard/VmsStatus.vue'
import { useXoAlarmCollection } from '@/remote-resources/use-xo-alarm-collection.ts'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoSiteDashboard } from '@/remote-resources/use-xo-site-dashboard.ts'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/remote-resources/use-xo-vm-controller-collection.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'

const uiStore = useUiStore()

const { dashboard, backupRepositories, storageRepositories, hasError, isDashboardReady } = useXoSiteDashboard()

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
