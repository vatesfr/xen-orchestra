<template>
  <div class="site-dashboard">
    <HostsStatus class="hosts-status" />
    <VmsStatus class="vms-status" />
    <DashboardAlarms />
  </div>
</template>

<script lang="ts" setup>
import HostsStatus from '@/components/site/dashboard/HostsStatus.vue'
import VmsStatus from '@/components/site/dashboard/VmsStatus.vue'
import DashboardAlarms from '@/components/pool/dashboard/DashboardAlarms.vue'
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
    'alarms alarms alarms alarms alarms alarms alarms patches';
}

.hosts-status {
  grid-area: hosts-status;
}

.vms-status {
  grid-area: vms-status;
}
</style>

