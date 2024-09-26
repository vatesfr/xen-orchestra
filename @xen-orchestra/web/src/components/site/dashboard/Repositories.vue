<template>
  <UiCard :horizontal="uiStore.isDesktop">
    <BackupRepository />
    <Divider type="stretch" />
    <StorageRepository />
    <Divider type="stretch" />
    <S3BackupRepository />
  </UiCard>
</template>

<script lang="ts" setup>
import BackupRepository from '@/components/site/dashboard/BackupRepository.vue'
import S3BackupRepository from '@/components/site/dashboard/S3BackupRepository.vue'
import StorageRepository from '@/components/site/dashboard/StorageRepository.vue'
import Divider from '@core/components/divider/Divider.vue'
import UiCard from '@core/components/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'

const uiStore = useUiStore()
</script>
