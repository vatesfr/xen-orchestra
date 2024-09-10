<template>
  <div class="site-dashboard">
    <HostsStatus class="hosts-status" />
    <VmsStatus class="vms-status" />
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
import Repositories from '@/components/site/dashboard/Repositories.vue'
import VmsStatus from '@/components/site/dashboard/VmsStatus.vue'
</script>

<style lang="postcss" scoped>
.site-dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'pools-status pools-status hosts-status hosts-status vms-status vms-status resources resources'
    'backups backups backups backups backup-issues backup-issues backup-issues backup-issues'
    'repositories repositories repositories repositories repositories repositories repositories repositories'
    'alarms alarms alarms alarms alarms alarms patches patches';
}

.hosts-status {
  grid-area: hosts-status;
}

.vms-status {
  grid-area: vms-status;
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
</style>
