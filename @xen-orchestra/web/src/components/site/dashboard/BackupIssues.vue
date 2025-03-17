<template>
  <UiCard>
    <UiCardTitle>
      {{ $t('backup-issues') }}
      <UiCounter :value="backupIssues.length" accent="danger" size="medium" variant="primary" />
      <template #description>{{ $t('in-last-three-jobs') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <VtsNoDataHero v-else-if="!hasBackupIssues" type="card" />
    <div v-else class="backup-items">
      <VtsBackupItem v-for="(coreBackupIssue, index) in coreBackupIssues" :key="index" :backup="coreBackupIssue" />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import { convertBackupIssueToCore } from '@/utils/convert-backup-issue-to-core.util'
import VtsBackupItem from '@core/components/backup-item/VtsBackupItem.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { computed } from 'vue'

const { backupIssues, isReady } = useDashboardStore().subscribe()

const hasBackupIssues = computed(() => backupIssues.value.length !== 0)

const coreBackupIssues = computed(() => backupIssues.value.map(convertBackupIssueToCore))
</script>

<style lang="postcss" scoped>
.backup-items {
  max-height: 30rem;
  overflow-y: auto;
  margin-inline: -2.4rem;
  margin-block-end: -2.4rem;
}
</style>
