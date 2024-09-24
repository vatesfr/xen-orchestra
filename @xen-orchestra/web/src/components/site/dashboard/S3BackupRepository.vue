<template>
  <div class="s3-backup-repository">
    <CardTitle>
      {{ $t('s3-backup-repository') }}
      <template #description>{{ $t('for-backup') }}</template>
    </CardTitle>
    <CardNumbers :value="usedSize?.value" :unit="usedSize?.prefix" :label="$t('used')" size="medium" />
  </div>
</template>

<script setup lang="ts">
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import { formatSizeRaw } from '@/utils/size.util'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import { computed } from 'vue'

const { record } = useDashboardStore().subscribe()

const usedSize = computed(() => formatSizeRaw(record.value?.backupRepositories?.s3?.size?.backups, 1))
</script>

<style scoped lang="postcss">
.s3-backup-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  flex: 1;
}
</style>
