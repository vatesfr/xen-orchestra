<template>
  <div class="updates">
    <UiInfo v-if="actionError !== undefined" accent="danger" wrap>{{ actionError }}</UiInfo>
    <UiInfo v-if="hasRecoveryError && recovery !== undefined" accent="warning" wrap>
      {{ t('rolling-update:stale-record') }}
    </UiInfo>
    <VtsStateHero v-if="!isRecoveryReady" format="page" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasRecoveryError && recovery === undefined" format="page" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <UiCard v-else-if="recovery?.status === 'blocked'" has-error>
      <UiCardTitle>{{ t('rolling-update') }}</UiCardTitle>
      <UiInfo accent="danger" wrap>{{ t('rolling-update:blocked') }}</UiInfo>
      <UiLogEntryViewer :content="recovery.blockedReason" :label="t('error')" size="small" accent="danger" />
      <VtsButtonGroup>
        <UiButton variant="secondary" accent="danger" size="medium" :disabled="isBusy" @click="openForceCloseModal()">
          {{ t('action:force-close') }}
        </UiButton>
      </VtsButtonGroup>
    </UiCard>
    <PoolUpdatesRun
      v-else-if="run !== undefined && runState !== undefined"
      :run
      :state="runState"
      :task
      :restored-items
      :is-busy
      @resume="openResumeModal({ props: { poolId: pool.id, operatorChanges: run.operatorChanges } })"
      @close="isForced => (isForced ? openForceCloseModal() : close(false))"
      @restore="restore"
    />
    <VtsStateHero v-else-if="state === 'up-to-date'" format="page" type="all-done" size="medium">
      {{ t('rolling-update:pool-up-to-date') }}
    </VtsStateHero>
    <PoolUpdatesStart v-else :pool :is-starting @start="checks => openStartModal({ props: { checks } })" />
  </div>
</template>

<script lang="ts" setup>
import PoolUpdatesRun from '@/modules/pool/components/updates/PoolUpdatesRun.vue'
import PoolUpdatesStart from '@/modules/pool/components/updates/PoolUpdatesStart.vue'
import { usePoolRollingUpdateRecovery } from '@/modules/pool/composables/use-pool-rolling-update-recovery.composable.ts'
import { useXoPoolFinalizeRollingUpdateJob } from '@/modules/pool/jobs/xo-pool-finalize-rolling-update.job.ts'
import { useXoPoolRestoreRollingUpdateItemJob } from '@/modules/pool/jobs/xo-pool-restore-rolling-update-item.job.ts'
import { useXoPoolResumeRollingUpdateJob } from '@/modules/pool/jobs/xo-pool-resume-rolling-update.job.ts'
import { useXoPoolRollingUpdateJob } from '@/modules/pool/jobs/xo-pool-rolling-update.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoPoolMissingPatchesCollection } from '@/modules/pool/remote-resources/use-xo-pool-missing-patches-collection.ts'
import { useXoPoolTasksCollection } from '@/modules/pool/remote-resources/use-xo-pool-tasks-collection.ts'
import {
  getRollingUpdatePageState,
  type RollingUpdateResumeOptions,
  type RollingUpdateStartOptions,
} from '@/modules/pool/utils/rolling-update.util.ts'
import { useXoTasksConversion } from '@/modules/task/composables/xo-tasks-conversion.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import type { PoolRollingUpdateRecoveryUnrestoredItem } from '@vates/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { recovery, isRecoveryReady, hasRecoveryError, reloadRecovery } = usePoolRollingUpdateRecovery(() => pool.id)

const { getTaskById, sortedTasks } = useXoPoolTasksCollection({}, () => pool.id)

const { reloadPoolMissingPatches } = useXoPoolMissingPatchesCollection({}, () => pool.id)

// Whether a run which succeeded was closed in this session: the pool is up to date, until another run shows up
const hasSucceeded = ref(false)

// Why the last action was refused or failed, when the record does not tell it
const actionError = ref<string>()

const restoredItems = ref<PoolRollingUpdateRecoveryUnrestoredItem[]>([])

const startOptions = ref<RollingUpdateStartOptions>()
const resumeOptions = ref<RollingUpdateResumeOptions>()
const force = ref(false)
const itemToRestore = ref<PoolRollingUpdateRecoveryUnrestoredItem>()

const { run: runStart, isRunning: isStarting } = useXoPoolRollingUpdateJob(() => pool, startOptions)
const { run: runResume, isRunning: isResuming } = useXoPoolResumeRollingUpdateJob(() => pool, resumeOptions)
const { run: runFinalize, isRunning: isFinalizing } = useXoPoolFinalizeRollingUpdateJob(() => pool, force)
const { run: runRestore, isRunning: isRestoring } = useXoPoolRestoreRollingUpdateItemJob(() => pool, itemToRestore)

const isBusy = computed(() => isStarting.value || isResuming.value || isFinalizing.value || isRestoring.value)

const state = computed(() => getRollingUpdatePageState(recovery.value, hasSucceeded.value))

const run = computed(() =>
  recovery.value === undefined || recovery.value.status === 'blocked' ? undefined : recovery.value
)

const runState = computed(() =>
  state.value === 'running' || state.value === 'interrupted' || state.value === 'review' ? state.value : undefined
)

const rawTasks = computed(() => {
  const taskId = run.value?.taskId

  const rawTask = taskId === undefined ? undefined : getTaskById(taskId as FrontXoTask['id'])

  return rawTask === undefined ? [] : [rawTask]
})

const { convertedTasks } = useXoTasksConversion(rawTasks)

const task = computed(() => convertedTasks.value[0])

// The record moves when a task of the pool starts or ends
watch(
  () => sortedTasks.value.map(({ id, status }) => `${id}:${status}`).join(),
  () => reloadRecovery()
)

watch(
  () => pool.id,
  () => {
    hasSucceeded.value = false
    actionError.value = undefined
    restoredItems.value = []
  }
)

watch(recovery, newRecovery => {
  if (newRecovery !== undefined) {
    hasSucceeded.value = false
  }
})

// A failed action leaves its trace in the record: reload it whatever the outcome
async function runAndReload(runJob: () => Promise<unknown>, onSuccess?: () => void) {
  actionError.value = undefined

  try {
    await runJob()
    onSuccess?.()
  } catch (error) {
    console.error(error)
    actionError.value = error instanceof Error ? error.message : String(error)
  } finally {
    await reloadRecovery()
  }
}

function close(isForced: boolean) {
  force.value = isForced

  const isClosingSucceededRun = recovery.value?.status === 'succeeded'

  void runAndReload(runFinalize, () => {
    hasSucceeded.value = isClosingSucceededRun

    // Not polled: the patches the run installed leave the list, and the counter of the tab, here
    void reloadPoolMissingPatches()
  })
}

function restore(item: PoolRollingUpdateRecoveryUnrestoredItem) {
  itemToRestore.value = item

  void runAndReload(runRestore, () => restoredItems.value.push(item))
}

// The dialogs close on confirm: a rolling update is not awaited, it is followed on the page
const { open: openStartModal } = useOverlay({
  component: () => import('@/modules/pool/components/updates/PoolRollingUpdateStartModal.vue'),
  events: {
    onConfirm: (options: RollingUpdateStartOptions) => {
      startOptions.value = options

      void runAndReload(runStart)
    },
    onCancel: true,
  },
})

const { open: openResumeModal } = useOverlay({
  component: () => import('@/modules/pool/components/updates/PoolRollingUpdateResumeModal.vue'),
  events: {
    onConfirm: (options: RollingUpdateResumeOptions) => {
      resumeOptions.value = options

      void runAndReload(runResume)
    },
    onCancel: true,
  },
})

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

// A forced close gives up what the run left unrestored: it is confirmed by typing the name of the pool
function openForceCloseModal() {
  openTypeToConfirmModal({
    props: {
      accent: 'danger',
      icon: 'status:danger-picto',
      title: t('rolling-update:force-close-title'),
      description: t('rolling-update:force-close-message'),
      confirmationText: pool.name_label,
      confirmLabel: t('action:force-close'),
    },
    events: { onConfirm: () => close(true) },
  })
}
</script>

<style lang="postcss" scoped>
.updates {
  display: flex;
  flex-direction: column;
  height: fit-content;
  gap: 0.8rem;
  margin: 0.8rem;
}
</style>
