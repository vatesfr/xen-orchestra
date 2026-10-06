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
        v-tooltip="!canBenchmark && benchmarkErrorMessage"
        size="medium"
        variant="tertiary"
        accent="brand"
        left-icon="action:scan"
        :disabled="!canBenchmark"
        :busy="isBenchmarking"
        @click="runBenchmark()"
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
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
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

const { runBenchmark, canBenchmark, isBenchmarking, benchmarkErrorMessage } = useXoBackupRepositoryBenchmark(() => br)

const {
  forgetBackupRepositories,
  canForgetBackupRepositories,
  isForgettingBackupRepositories,
  forgetBackupRepositoriesErrorMessage,
} = useBackupRepositoryForget(() => [br])
</script>
