<!-- v1.0 -->
<template>
  <div class="backup-item">
    <RouterLink :to="backup.route">
      {{ backup.label }}
    </RouterLink>
    <div class="states">
      <BackupState v-for="(state, index) in backup.states" :key="index" :state />
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupState from '@core/components/backup-state/BackupState.vue'
import type { Backup } from '@core/types/backup.type'

defineProps<{
  backup: Backup
}>()
</script>

<style lang="postcss" scoped>
.backup-item {
  padding: 0.8rem 0.4rem;
  border-top: 0.1rem solid var(--color-grey-500);
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.states {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
</style>
