<template>
  <div class="site-dashboard" :class="{ mobile: uiStore.isMobile }">
    <SiteDashboardPoolsStatus class="pools-status" :status="dashboard.poolsStatus" :has-error />
    <SiteDashboardHostsStatus class="hosts-status" :status="dashboard.hostsStatus" :has-error />
    <SiteDashboardVmsStatus class="vms-status" :status="dashboard.vmsStatus" :has-error />
    <DashboardAlarms class="alarms" :alarms :is-ready="areAlarmsReady" :has-error="hasAlarmFetchError" />
    <SiteDashboardPatches
      class="patches"
      :missing-patches="dashboard.missingPatches"
      :n-hosts="dashboard.nHosts"
      :n-hosts-eol="dashboard.nHostsEol"
      :n-pools="dashboard.nPools"
      :has-error
    />
    <SiteDashboardResourcesOverview class="resources-overview" :resources="dashboard.resourcesOverview" :has-error />
    <SiteDashboardBackups class="backups" :backups="dashboard.backups" :has-error />
    <SiteDashboardBackupIssues class="backup-issues" :issues="dashboard.backups?.issues" />
    <SiteDashboardRepositories
      class="repositories"
      :backup-repositories
      :storage-repositories
      :s3-size="dashboard.backupRepositories?.s3?.size"
      :has-error
    />
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

const uiStore = useUiStore()

const { dashboard, backupRepositories, storageRepositories, hasError } = useXoSiteDashboard()

const { alarms, hasAlarmFetchError, areAlarmsReady } = useXoAlarmCollection()
</script>

<style lang="postcss" scoped>
.site-dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'pools-status pools-status hosts-status hosts-status vms-status vms-status resources-overview resources-overview'
    'alarms alarms alarms alarms alarms alarms patches patches'
    'backups backups backups backup-issues backup-issues backup-issues backup-issues backup-issues'
    'repositories repositories repositories repositories repositories repositories repositories repositories';

  &.mobile {
    grid-template-columns: minmax(20rem, 1fr);
    grid-template-areas:
      'pools-status'
      'hosts-status'
      'vms-status'
      'alarms'
      'patches'
      'resources-overview'
      'backups'
      'backup-issues'
      'repositories';
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

  .backups {
    grid-area: backups;
  }

  .backup-issues {
    grid-area: backup-issues;
  }

  .repositories {
    grid-area: repositories;
  }
}
</style>
