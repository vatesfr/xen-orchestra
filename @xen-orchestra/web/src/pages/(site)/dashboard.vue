<template>
  <div class="site-dashboard" :class="{ mobile: uiStore.isMobile }">
    <PoolsStatus class="pools-status" :status="dashboard.poolsStatus" :has-error />
    <HostsStatus class="hosts-status" :status="dashboard.hostsStatus" :has-error />
    <VmsStatus class="vms-status" :status="dashboard.vmsStatus" :has-error />
    <Alarms class="alarms" :alarms />
    <Patches
      class="patches"
      :missing-patches="dashboard.missingPatches"
      :n-hosts="dashboard.nHosts"
      :n-hosts-eol="dashboard.nHostsEol"
      :n-pools="dashboard.nPools"
      :has-error
    />
    <ResourcesOverview class="resources-overview" :resources="dashboard.resourcesOverview" :has-error />
    <Backups class="backups" :backups="dashboard.backups" :has-error />
    <BackupIssues class="backup-issues" :issues="dashboard.backups?.issues" />
    <Repositories
      class="repositories"
      :backup-repositories
      :storage-repositories
      :s3-size="dashboard.backupRepositories?.s3?.size"
      :has-error
    />
  </div>
</template>

<script lang="ts" setup>
import Alarms from '@/components/site/dashboard/Alarms.vue'
import BackupIssues from '@/components/site/dashboard/BackupIssues.vue'
import Backups from '@/components/site/dashboard/Backups.vue'
import HostsStatus from '@/components/site/dashboard/HostsStatus.vue'
import Patches from '@/components/site/dashboard/Patches.vue'
import PoolsStatus from '@/components/site/dashboard/PoolsStatus.vue'
import Repositories from '@/components/site/dashboard/Repositories.vue'
import ResourcesOverview from '@/components/site/dashboard/ResourcesOverview.vue'
import VmsStatus from '@/components/site/dashboard/VmsStatus.vue'
import { useXoAlarmCollection } from '@/remote-resources/use-xo-alarm-collection.ts'
import { useXoSiteDashboard } from '@/remote-resources/use-xo-site-dashboard.ts'
import { useUiStore } from '@core/stores/ui.store.ts'

const uiStore = useUiStore()

const { dashboard, backupRepositories, storageRepositories, hasError } = useXoSiteDashboard()

const { alarms } = useXoAlarmCollection()
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
