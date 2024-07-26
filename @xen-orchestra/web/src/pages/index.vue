<template>
  <div class="site-dashboard">
    <VmsStatus class="vms-status" />
  </div>
</template>

<script lang="ts" setup>
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
    'alarms alarms alarms alarms alarms alarms alarms patches';
}

.vms-status {
  grid-area: vms-status;
}
</style>
