<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('backup-targets') }}
      <UiCounter :value="backupTargetsCount" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <BackupJobTargetsSection
      v-if="backupRepositoryTargets.length > 0"
      :targets="backupRepositoryTargets"
      :label="t('backup-repositories')"
    />
    <VtsDivider v-if="storageRepositoryTargets.length > 0 && backupRepositoryTargets.length > 0" type="stretch" />
    <BackupJobTargetsSection
      v-if="storageRepositoryTargets.length > 0"
      :targets="storageRepositoryTargets"
      :label="t('storage-repositories')"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import BackupJobTargetsSection from '@/components/backups/panel/card-items/BackupJobTargetsSection.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import type { XoSr, XoBackupRepository } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositoryTargets, backupRepositoryTargets } = defineProps<{
  storageRepositoryTargets: XoSr[]
  backupRepositoryTargets: XoBackupRepository[]
}>()

const { t } = useI18n()

const backupTargetsCount = computed(() => backupRepositoryTargets.length + storageRepositoryTargets.length)
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
