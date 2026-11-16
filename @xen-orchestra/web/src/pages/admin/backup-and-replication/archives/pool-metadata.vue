<template>
  <div class="container">
    <UiCard>
      <PoolBackupArchivesTable :backup-archives="[]" :busy="false" :error="false" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import PoolBackupArchivesTable from '@/modules/backup-archive/components/list/PoolBackupArchivesTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
