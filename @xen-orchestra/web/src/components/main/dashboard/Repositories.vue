<template>
  <UiCard :horizontal="uiStore.isDesktop">
    <BackupRepository />
    <VtsDivider type="stretch" />
    <StorageRepository />
    <VtsDivider type="stretch" />
    <S3BackupRepository />
  </UiCard>
</template>

<script lang="ts" setup>
import BackupRepository from '@/components/main/dashboard/BackupRepository.vue'
import S3BackupRepository from '@/components/main/dashboard/S3BackupRepository.vue'
import StorageRepository from '@/components/main/dashboard/StorageRepository.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'

const uiStore = useUiStore()
</script>
