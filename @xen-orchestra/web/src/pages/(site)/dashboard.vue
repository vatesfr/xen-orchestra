<template>
  <div class="site-dashboard" :class="{ mobile: uiStore.isSmall }">
    <SiteDashboardPoolsStatus class="pools-status" />
    <SiteDashboardHostsStatus class="hosts-status" />
    <SiteDashboardVmsStatus class="vms-status" />
    <SiteDashboardResourcesOverview class="resources-overview" />
    <DashboardAlarms class="alarms" :alarms :is-ready :has-error="hasAlarmFetchError" />
    <SiteDashboardPatches class="patches" />
    <SiteDashboardBackupJobsStatus class="backup-jobs-status" />
    <SiteDashboardBackupIssues class="backup-issues" />
    <SiteDashboardVmsProtection class="vms-protection" />
    <SiteDashboardBackupRepository class="backup-repository" />
    <SiteDashboardStorageRepository class="storage-repository" />
    <SiteDashboardS3BackupRepository class="s3-backup-repository" />
  </div>
</template>

<script lang="ts" setup>
import DashboardAlarms from '@/modules/alarm/components/DashboardAlarms.vue'
import { useXoAlarmCollection } from '@/modules/alarm/remote-resources/use-xo-alarm-collection.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
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
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'

const uiStore = useUiStore()

const { alarms, hasAlarmFetchError, areAlarmsReady } = useXoAlarmCollection()
const { areHostsReady } = useXoHostCollection()
const { areVmsReady } = useXoVmCollection()
const { areVmControllersReady } = useXoVmControllerCollection()
const { areSrsReady } = useXoSrCollection()

const isReady = logicAnd(areAlarmsReady, areHostsReady, areVmsReady, areVmControllersReady, areSrsReady)
</script>

<style lang="postcss" scoped>
.site-dashboard {
  margin: 0.8rem;
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(12, 1fr);
  grid-template-areas:
    'pools-status pools-status pools-status hosts-status hosts-status hosts-status vms-status vms-status vms-status resources-overview resources-overview resources-overview'
    'alarms alarms alarms alarms alarms alarms alarms alarms patches patches patches patches'
    'backup-jobs-status backup-jobs-status backup-jobs-status backup-jobs-status backup-issues backup-issues backup-issues backup-issues vms-protection vms-protection vms-protection vms-protection'
    'backup-repository backup-repository backup-repository backup-repository storage-repository storage-repository storage-repository storage-repository s3-backup-repository s3-backup-repository s3-backup-repository s3-backup-repository';

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

  &.mobile {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
