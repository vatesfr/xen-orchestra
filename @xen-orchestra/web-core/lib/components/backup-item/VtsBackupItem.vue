<template>
  <div class="vts-backup-item">
    <RouterLink v-if="backup.route !== undefined" :to="backup.route">
      {{ backup.label }}
    </RouterLink>
    <p v-else class="typo-body-bold">
      {{ backup.label }}
    </p>
    <div class="states">
      <VtsBackupState v-for="(state, index) in backup.states" :key="index" :state />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsBackupState, { type BackupState } from '@core/components/backup-state/VtsBackupState.vue'
import type { RouteLocationRaw } from 'vue-router'

export type BackupStates = BackupState[]

export type Backup = {
  label: string
  route?: RouteLocationRaw
  states: BackupStates
}

defineProps<{
  backup: Backup
}>()
</script>

<style lang="postcss" scoped>
.vts-backup-item {
  padding: 0.8rem 0.4rem;
  border-top: 0.1rem solid var(--color-neutral-border);
  display: flex;
  align-items: center;
  gap: 0.2rem;

  .states {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }
}
</style>
