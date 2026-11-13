<template>
  <div class="archives">
    <BackupArchivesMenu class="menu" />
    <RouterView class="content" />
  </div>
</template>

<script lang="ts" setup>
import BackupArchivesMenu from '@/modules/backup-archive/components/BackupArchivesMenu.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/admin/backup-and-replication/archives', 'vms')
</script>

<style scoped lang="postcss">
.archives {
  display: flex;
  align-items: flex-start;

  .menu {
    flex-shrink: 0;
    margin-block: 0.8rem;
    margin-inline-start: 0.8rem;
  }

  .content {
    flex: 1;
    min-width: 0;
  }
}
</style>
