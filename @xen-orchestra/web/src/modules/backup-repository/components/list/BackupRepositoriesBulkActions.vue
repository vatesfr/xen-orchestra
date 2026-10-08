<template>
  <VtsTableBulkActions :actions="bulkActions" />
</template>

<script lang="ts" setup>
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { brs } = defineProps<{
  brs: FrontXoBackupRepository[]
}>()

const { t } = useI18n()

const { openEditBackupRepositoriesDrawer } = useEditBackupRepository()

const {
  run: connectBackupRepositories,
  canRun: canConnectBackupRepositories,
  isRunning: isConnectingBackupRepositories,
  errorMessage: connectBackupRepositoriesErrorMessage,
} = useXoBackupRepositoryChangeStateJob(() => brs, true)

const {
  run: disableBackupRepositories,
  canRun: canDisableBackupRepositories,
  isRunning: isDisablingBackupRepositories,
  errorMessage: disableBackupRepositoriesErrorMessage,
} = useXoBackupRepositoryChangeStateJob(() => brs, false)

const {
  run: benchmarkBackupRepositories,
  canRun: canBenchmarkBackupRepositories,
  isRunning: isBenchmarkingBackupRepositories,
  errorMessage: benchmarkBackupRepositoriesErrorMessage,
} = useXoBackupRepositoryBenchmarkJob(() => brs)

const {
  forgetBackupRepositories,
  canForgetBackupRepositories,
  isForgettingBackupRepositories,
  forgetBackupRepositoriesErrorMessage,
} = useBackupRepositoryForget(() => brs)

const noBrSelectedHint = computed(() => (brs.length === 0 ? t('no-br-selected') : undefined))

const benchmarkHint = computed(() => {
  if (noBrSelectedHint.value !== undefined) {
    return noBrSelectedHint.value
  }

  if (brs.some(br => !br.enabled)) {
    return t('some-selected-brs-disabled')
  }

  return benchmarkBackupRepositoriesErrorMessage.value
})

const bulkActions = computed<ActionItem[]>(() => [
  {
    label: t('action:change-state'),
    icon: 'action:change-state',
    disabled: brs.length === 0,
    hint: noBrSelectedHint.value,
    children: [
      {
        label: t('action:connect'),
        icon: 'status:success-circle',
        onClick: () => connectBackupRepositories(),
        disabled: !canConnectBackupRepositories.value,
        busy: isConnectingBackupRepositories.value,
        hint: connectBackupRepositoriesErrorMessage.value,
      },
      {
        label: t('action:disable'),
        icon: 'status:disabled',
        onClick: () => disableBackupRepositories(),
        disabled: !canDisableBackupRepositories.value,
        busy: isDisablingBackupRepositories.value,
        hint: disableBackupRepositoriesErrorMessage.value,
      },
    ],
  },
  {
    label: t('action:edit'),
    icon: 'action:edit',
    onClick: () => openEditBackupRepositoriesDrawer(brs),
    disabled: brs.length === 0,
    hint: noBrSelectedHint.value,
  },
  {
    label: t('action:test-speed'),
    icon: 'action:scan',
    onClick: () => benchmarkBackupRepositories(),
    disabled: !canBenchmarkBackupRepositories.value,
    busy: isBenchmarkingBackupRepositories.value,
    hint: benchmarkHint.value,
  },
  {
    label: t('action:forget'),
    icon: 'action:forget',
    onClick: () => forgetBackupRepositories(),
    disabled: !canForgetBackupRepositories.value,
    busy: isForgettingBackupRepositories.value,
    hint: noBrSelectedHint.value ?? forgetBackupRepositoriesErrorMessage.value,
    accent: 'danger',
  },
])
</script>
