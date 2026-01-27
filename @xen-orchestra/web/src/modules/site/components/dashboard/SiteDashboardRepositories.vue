<template>
  <UiCard :has-error :horizontal="!uiStore.isMobile">
    <SiteDashboardBackupRepository :repositories="backupRepositories" :has-error />
    <VtsDivider type="stretch" />
    <SiteDashboardStorageRepository :repositories="storageRepositories" />
    <VtsDivider type="stretch" />
    <SiteDashboardS3BackupRepository :size="s3Size" :has-error />
  </UiCard>
</template>

<script lang="ts" setup>
import SiteDashboardBackupRepository from '@/modules/site/components/dashboard/SiteDashboardBackupRepository.vue'
import SiteDashboardS3BackupRepository from '@/modules/site/components/dashboard/SiteDashboardS3BackupRepository.vue'
import SiteDashboardStorageRepository from '@/modules/site/components/dashboard/SiteDashboardStorageRepository.vue'
import type { BackupRepositories, StorageRepositories } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

const { backupRepositories, storageRepositories } = defineProps<{
  s3Size: NonNullable<XoDashboard['backupRepositories']>['s3']['size'] | undefined
  backupRepositories: BackupRepositories | undefined
  storageRepositories: StorageRepositories | undefined
  hasError?: boolean
}>()

const uiStore = useUiStore()
</script>
