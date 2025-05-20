<template>
  <div class="s3-backup-repository">
    <UiCardTitle>
      {{ $t('s3-backup-repository') }}
      <template #description>{{ $t('for-backup') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="!s3BackupRepositoryIsReady" type="card" />
    <UiCardNumbers v-else :value="usedSize?.value" :unit="usedSize?.prefix" :label="$t('used')" size="medium" />
  </div>
</template>

<script setup lang="ts">
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { record } = useDashboardStore().subscribe()

const s3BackupRepositoryIsReady = computed(() => record.value?.backupRepositories?.s3 !== undefined)

const usedSize = computed(() => formatSizeRaw(record.value?.backupRepositories?.s3.size.backups, 1))
</script>

<style scoped lang="postcss">
.s3-backup-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  flex: 1;
}
</style>
