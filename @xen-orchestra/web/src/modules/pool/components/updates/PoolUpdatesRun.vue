<template>
  <div class="pool-updates-run">
    <UiCard :has-error="run.status === 'failed'">
      <UiCardTitle>{{ t('rolling-update') }}</UiCardTitle>
      <div>
        <VtsCardRowKeyValue>
          <template #key>{{ t('status') }}</template>
          <template #value>
            <UiTag :accent="RUN_ACCENTS[run.status]" variant="secondary">
              {{ t(`rolling-update:status:${run.status}`) }}
            </UiTag>
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('started') }}</template>
          <template #value>{{ formatDateTime(run.startedAt) }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue v-if="run.attempt !== undefined">
          <template #key>{{ t('attempt') }}</template>
          <template #value>{{ run.attempt }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue v-if="estimatedEnd !== undefined">
          <template #key>{{ t('estimated-end') }}</template>
          <template #value>{{ formatDateTime(estimatedEnd) }}</template>
        </VtsCardRowKeyValue>
      </div>
      <UiProgressBar
        accent="info"
        :fill-width="`${progress}%`"
        :legend="{ label: t('progress'), value: `${progress}%` }"
      />
      <UiInfo v-if="run.planChange !== undefined" accent="warning" wrap>
        {{ t('rolling-update:plan-change', { n: run.planChange.addedHostIds.length }) }}
      </UiInfo>
      <UiInfo v-if="lastError !== null && !isHostError" accent="danger" wrap>
        {{ getRollingUpdateErrorSummary(t, lastError) }}
      </UiInfo>
      <template v-for="hostId in hostIds" :key="hostId">
        <VtsDivider type="stretch" />
        <PoolUpdatesHost :host-id :host="run.hosts[hostId]" :hide-error="state === 'running'" />
      </template>
      <template v-if="state !== 'running'">
        <VtsDivider type="stretch" />
        <VtsButtonGroup>
          <UiButton
            v-if="canResume"
            variant="primary"
            accent="brand"
            size="medium"
            :disabled="isBusy"
            @click="emit('resume')"
          >
            {{ state === 'review' ? t('action:retry-migration') : t('action:resume') }}
          </UiButton>
          <UiButton
            variant="secondary"
            accent="brand"
            size="medium"
            :disabled="isBusy || !canClose"
            @click="emit('close', false)"
          >
            {{ t('action:close-run') }}
          </UiButton>
          <UiButton
            v-if="run.status !== 'succeeded'"
            variant="secondary"
            accent="danger"
            size="medium"
            :disabled="isBusy"
            @click="emit('close', true)"
          >
            {{ t('action:force-close') }}
          </UiButton>
        </VtsButtonGroup>
      </template>
    </UiCard>

    <UiCard v-if="run.vmConflicts.length > 0">
      <UiCardTitle>{{ t('rolling-update:vm-conflicts') }}</UiCardTitle>
      <UiInfo
        v-for="conflict in run.vmConflicts"
        :key="conflict.vmId"
        :accent="conflict.reason === 'migration-failed' ? 'danger' : 'warning'"
        wrap
      >
        {{
          t(`rolling-update:vm-conflict:${conflict.reason}`, {
            vm: conflict.vmName ?? conflict.vmId,
            host: getHostById(conflict.hostId as never)?.name_label ?? conflict.hostId,
          })
        }}
        <template v-if="conflict.message !== undefined">{{ `: ${conflict.message}` }}</template>
      </UiInfo>
    </UiCard>

    <UiCard v-if="run.operatorChanges.length > 0">
      <UiCardTitle>{{ t('rolling-update:operator-changes') }}</UiCardTitle>
      <UiInfo v-for="change in run.operatorChanges" :key="getRollingUpdateItemKey(change)" accent="warning" wrap>
        {{ getRollingUpdateOperatorChangeLabel(t, change) }}
      </UiInfo>
    </UiCard>

    <UiCard v-if="items.length > 0">
      <UiCardTitle>{{ t('rolling-update:unrestored-items') }}</UiCardTitle>
      <VtsCardRowKeyValue v-for="{ item, isRestored } in items" :key="getRollingUpdateItemKey(item)">
        <template #key>{{ getRollingUpdateItemLabel(t, item) }}</template>
        <template #value>
          <UiTag v-if="isRestored" accent="success" variant="secondary">{{ t('restored') }}</UiTag>
          <UiTag v-else-if="!item.restorable" accent="neutral" variant="secondary">
            {{ t('rolling-update:not-restorable') }}
          </UiTag>
          <UiButton
            v-else
            variant="secondary"
            accent="brand"
            size="small"
            :busy="
              restoringItem !== undefined && getRollingUpdateItemKey(restoringItem) === getRollingUpdateItemKey(item)
            "
            :disabled="isBusy || state === 'running'"
            @click="emit('restore', item)"
          >
            {{ t('action:restore') }}
          </UiButton>
        </template>
      </VtsCardRowKeyValue>
    </UiCard>

    <UiCard v-if="subtasks.length > 0">
      <UiCardTitle>{{ t('tasks') }}</UiCardTitle>
      <UiTaskList :tasks="subtasks" />
    </UiCard>

    <UiCard v-if="lastError !== null">
      <UiCardTitle>{{ t('rolling-update:error-details') }}</UiCardTitle>
      <UiLogEntryViewer :content="lastError" :label="t('error')" size="small" accent="danger" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import PoolUpdatesHost from '@/modules/pool/components/updates/PoolUpdatesHost.vue'
import {
  canCloseRollingUpdate,
  getRollingUpdateErrorSummary,
  getRollingUpdateEstimatedEnd,
  getRollingUpdateItemKey,
  getRollingUpdateItemLabel,
  getRollingUpdateOperatorChangeLabel,
  getRollingUpdateProgress,
  type RollingUpdatePageState,
} from '@/modules/pool/utils/rolling-update.util.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import type { PoolRollingUpdateRecoveryRun, PoolRollingUpdateRecoveryUnrestoredItem } from '@vates/types'
import { isEqual } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { run, state, task, restoredItems, restoringItem } = defineProps<{
  run: PoolRollingUpdateRecoveryRun
  state: Extract<RollingUpdatePageState, 'running' | 'interrupted' | 'review'>
  // The task of the run, when it is still known
  task: Task | undefined
  // The items restored since the page was opened
  restoredItems: PoolRollingUpdateRecoveryUnrestoredItem[]
  // The item whose restore is in progress
  restoringItem?: PoolRollingUpdateRecoveryUnrestoredItem
  isBusy: boolean
}>()

const emit = defineEmits<{
  resume: []
  close: [force: boolean]
  restore: [item: PoolRollingUpdateRecoveryUnrestoredItem]
}>()

const RUN_ACCENTS: Record<PoolRollingUpdateRecoveryRun['status'], TagAccent> = {
  preparing: 'info',
  running: 'info',
  resuming: 'info',
  cleaning: 'info',
  interrupted: 'warning',
  'awaiting-acceptance': 'warning',
  failed: 'danger',
  succeeded: 'success',
}

const { t } = useI18n()

const { getHostById } = useXoHostCollection()

const hostIds = computed(() => run.hostOrder ?? Object.keys(run.hosts))

// From the record, as the steps of the hosts: the task is not always known, e.g. after a restart of xo-server
const progress = computed(() => getRollingUpdateProgress(run))

// The record keeps the error of the previous attempt until the run stops again: it is hidden while the run is resumed
const lastError = computed(() => (state === 'running' ? null : run.lastError))

// The error of the run is most often the one of a host, which shows it
const isHostError = computed(() => hostIds.value.some(hostId => isEqual(run.hosts[hostId]?.lastError, lastError.value)))

const estimatedEnd = computed(() => (state === 'running' ? getRollingUpdateEstimatedEnd(run, Date.now()) : undefined))

const subtasks = computed(() => task?.subtasks ?? [])

// A run which succeeded has nothing left to resume: it can only be closed
const canResume = computed(() => run.status !== 'succeeded' && run.resumable !== false)

const canClose = computed(() => canCloseRollingUpdate(run))

const items = computed(() => {
  const unrestoredItems = run.unrestoredItems ?? []

  const unrestoredKeys = new Set(unrestoredItems.map(getRollingUpdateItemKey))

  return [
    ...unrestoredItems.map(item => ({ item, isRestored: false })),
    ...restoredItems
      .filter(item => !unrestoredKeys.has(getRollingUpdateItemKey(item)))
      .map(item => ({ item, isRestored: true })),
  ]
})
</script>

<style lang="postcss" scoped>
.pool-updates-run {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
