<template>
  <VtsForgetButton
    :hint="forgetBackupRepositoriesErrorMessage"
    :disabled="!canForgetBackupRepositories"
    :busy="isForgettingBackupRepositories"
    @click="forgetBackupRepositories()"
  />
</template>

<script lang="ts" setup>
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsForgetButton from '@core/components/forget-button/VtsForgetButton.vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const {
  forgetBackupRepositories,
  canForgetBackupRepositories,
  isForgettingBackupRepositories,
  forgetBackupRepositoriesErrorMessage,
} = useBackupRepositoryForget(() => [br])
</script>
