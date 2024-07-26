<template>
  <UiCard :horizontal="isDesktop">
    <!-- <BackupRepository /> -->
    <UiSeparator />
    <StorageRepository />
    <UiSeparator />
    <S3BackupRepository />
  </UiCard>
</template>

<script setup lang="ts">
// import BackupRepository from '@/components/pool/dashboard/BackupRepository.vue'
import S3BackupRepository from '@/components/pool/dashboard/S3BackupRepository.vue'
import StorageRepository from '@/components/pool/dashboard/StorageRepository.vue'
import UiCard from '@core/components/UiCard.vue'
import UiSeparator from '@core/components/UiSeparator.vue'
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'

const uiStore = useUiStore()
const { isDesktop } = storeToRefs(uiStore)
</script>
