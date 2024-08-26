<template>
  <UiCard :horizontal="uiStore.isDesktop">
    <BackupRepository />
  </UiCard>
</template>

<script lang="ts" setup>
import BackupRepository from '@/components/site/dashboard/BackupRepository.vue'
import UiCard from '@core/components/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'

const uiStore = useUiStore()
</script>
