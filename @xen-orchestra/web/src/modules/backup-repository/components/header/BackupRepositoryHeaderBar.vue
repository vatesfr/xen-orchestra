<template>
  <UiHeadBar>
    {{ br.name }}
    <template #icon>
      <VtsIcon size="medium" :name="icon" />
    </template>
    <template #actions>
      <BackupRepositoryChangeStateButton :br />
      <UiButton
        size="medium"
        variant="tertiary"
        accent="brand"
        left-icon="action:edit"
        @click="openEditBackupRepositoryDrawer(br)"
      >
        {{ t('action:edit') }}
      </UiButton>
      <UiButton
        v-tooltip="!canBenchmarkBackupRepository && benchmarkBackupRepositoryErrorMessage"
        size="medium"
        variant="tertiary"
        accent="brand"
        left-icon="action:scan"
        :disabled="!canBenchmarkBackupRepository"
        :busy="isBenchmarkingBackupRepository"
        @click="benchmarkBackupRepository()"
      >
        {{ t('action:test-speed') }}
      </UiButton>
      <UiButton
        v-tooltip="!canForgetBackupRepositories && forgetBackupRepositoriesErrorMessage"
        size="medium"
        variant="tertiary"
        accent="danger"
        left-icon="action:forget"
        :disabled="!canForgetBackupRepositories"
        :busy="isForgettingBackupRepositories"
        @click="forgetBackupRepositories()"
      >
        {{ t('action:forget') }}
      </UiButton>
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import BackupRepositoryChangeStateButton from '@/modules/backup-repository/components/actions/change-state/BackupRepositoryChangeStateButton.vue'
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
  icon: IconName
}>()

const { t } = useI18n()

const { openEditBackupRepositoryDrawer } = useEditBackupRepository()

const {
  run: benchmarkBackupRepository,
  canRun: canBenchmarkBackupRepository,
  isRunning: isBenchmarkingBackupRepository,
  errorMessage: benchmarkBackupRepositoryErrorMessage,
} = useXoBackupRepositoryBenchmarkJob(() => [br])

const {
  forgetBackupRepositories,
  canForgetBackupRepositories,
  isForgettingBackupRepositories,
  forgetBackupRepositoriesErrorMessage,
} = useBackupRepositoryForget(() => [br])
</script>
