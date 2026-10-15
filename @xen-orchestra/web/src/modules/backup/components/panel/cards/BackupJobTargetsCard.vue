<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('backup-targets')" :counter="backupTargetsCount" />
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
  </UiPanelCard>
</template>

<script lang="ts" setup>
import BackupJobTargetsSection from '@/modules/backup/components/panel/card-items/BackupJobTargetsSection.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositoryTargets, backupRepositoryTargets } = defineProps<{
  storageRepositoryTargets: FrontXoSr[]
  backupRepositoryTargets: FrontXoBackupRepository[]
}>()

const { t } = useI18n()

const backupTargetsCount = computed(() => backupRepositoryTargets.length + storageRepositoryTargets.length)
</script>
