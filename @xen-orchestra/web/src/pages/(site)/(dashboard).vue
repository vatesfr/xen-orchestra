<template>
  <div class="site-dashboard" :class="{ mobile: uiStore.isMobile }">
    <PoolsStatus class="pools-status" />
    <HostsStatus class="hosts-status" />
    <VmsStatus class="vms-status" />
    <ResourcesOverview class="resources-overview" />
    <Backups class="backups" />
    <BackupIssues class="backup-issues" />
    <Repositories class="repositories" />
    <Patches class="patches" />
  </div>
</template>

<script lang="ts" setup>
import BackupIssues from '@/components/site/dashboard/BackupIssues.vue'
import Backups from '@/components/site/dashboard/Backups.vue'
import HostsStatus from '@/components/site/dashboard/HostsStatus.vue'
import Patches from '@/components/site/dashboard/Patches.vue'
import PoolsStatus from '@/components/site/dashboard/PoolsStatus.vue'
import Repositories from '@/components/site/dashboard/Repositories.vue'
import ResourcesOverview from '@/components/site/dashboard/ResourcesOverview.vue'
import VmsStatus from '@/components/site/dashboard/VmsStatus.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.site-dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'pools-status pools-status hosts-status hosts-status vms-status vms-status resources-overview resources-overview'
    'backups backups backups backup-issues backup-issues backup-issues backup-issues backup-issues'
    'repositories repositories repositories repositories repositories repositories repositories repositories'
    'alarms alarms alarms alarms alarms alarms patches patches';

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'pools-status'
      'hosts-status'
      'vms-status'
      'resources-overview'
      'backups'
      'backup-issues'
      'repositories'
      'patches';
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

  .patches {
    grid-area: patches;
  }
}
</style>
