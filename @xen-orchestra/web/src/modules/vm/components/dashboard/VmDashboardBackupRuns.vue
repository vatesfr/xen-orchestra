<template>
  <UiCard :has-error="isError">
    <UiCardTitle>
      {{ t('last-n-backup-runs', 3) }}
      <template v-if="!isEmpty" #info>
        <UiLink size="small" :to="{ name: '/vm/[id]/backups', params: { id: vmId } }">
          {{ t('backup-jobs:see-all') }}
        </UiLink>
      </template>
    </UiCardTitle>

    <div v-if="areBackupRunsReady && !isError" class="backup-head">
      <div class="protection-infos">
        <VtsQuickInfoRow :label="t('protection-status')">
          <template #value>
            <UiInfo :accent="infoVmProtectionStatus.accent">{{ infoVmProtectionStatus.text }}</UiInfo>
          </template>
        </VtsQuickInfoRow>
        <UiButton
          accent="brand"
          left-icon="status:info-circle"
          size="small"
          variant="tertiary"
          @click="openProtectionHelpModal()"
        >
          {{ t('what-does-protected-means?') }}
        </UiButton>
      </div>
    </div>

    <UiAlert v-if="isNotInActiveJob" accent="warning">
      <span class="typo-body-bold">{{ t('no-job-vm') }}</span>
      <template #description>
        <I18nT keypath="configure-for-protected" scope="global" tag="div">
          <template #backup-job>
            <UiLink size="small" :to="{ name: '/(site)/backups' }">
              {{ t('backup-job') }}
            </UiLink>
          </template>
        </I18nT>
      </template>
    </UiAlert>

    <VtsTable :state horizontal>
      <thead v-if="!isEmpty">
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="lastRun of lastRuns" :key="lastRun.backupJobId">
          <BodyCells :item="lastRun" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection'
import type { VmDashboardRun, VmProtectionStatus, XoVmDashboard } from '@/modules/vm/types/vm-dashboard.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useMapper } from '@core/packages/mapper'
import { useModal } from '@core/packages/modal/use-modal'
import { useBackupRunColumns } from '@core/tables/column-sets/vm-backup-run-colums'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { hasError, vmId, vmDashboard } = defineProps<{
  vmDashboard: XoVmDashboard | undefined
  vmId: string
  hasError: boolean
}>()

const { t } = useI18n()

const { getBackupJobById, areBackupJobsReady, hasBackupJobFetchError } = useXoBackupJobCollection()

const openProtectionHelpModal = useModal(() => ({
  component: import('@xen-orchestra/web/src/shared/components/modals/VmProtectedHelper.vue'),
}))

const lastRuns = computed(() => vmDashboard?.backupsInfo?.lastRuns)

const areBackupRunsReady = computed(() => areBackupJobsReady.value && lastRuns.value !== undefined)

const isEmpty = computed(() => lastRuns?.value?.length === 0)

const isError = computed(() => hasBackupJobFetchError.value || hasError)

const isNotInActiveJob = computed(() => vmDashboard?.backupsInfo?.vmProtection === 'not-in-active-job')

const vmProtection = computed(() => vmDashboard?.backupsInfo?.vmProtection)

const infoVmProtectionStatus = useMapper<VmProtectionStatus, { accent: InfoAccent; text: string }>(
  () => vmProtection.value,
  {
    'not-in-active-job': { accent: 'danger', text: t('backups:vms-protection:no-active-job') },
    unprotected: { accent: 'warning', text: t('backups:vms-protection:active-unprotected') },
    protected: { accent: 'success', text: t('backups:vms-protection:active-protected') },
  },
  'protected'
)

const state = useTableState({
  busy: () => !areBackupRunsReady.value,
  error: () => (isError.value ? { type: 'error', message: t('error-no-data'), size: 'extra-small' } : false),
  empty: () =>
    isEmpty.value && !isNotInActiveJob.value
      ? {
          type: 'no-result',
          message: t('is-part-of-one-active-job'),
          size: 'small',
        }
      : false,
})

const { HeadCells, BodyCells } = useBackupRunColumns({
  body: (run: VmDashboardRun) => {
    return {
      date: r => r(run.timestamp),
      backupArchiveStatus: r => r({ status: run.status }),
      backupJob: r =>
        r({
          label: getBackupJobById(run.backupJobId)?.name ?? run.backupJobId,
          to: { name: '/vm/[id]/backups', params: { id: vmId }, query: { id: run.backupJobId } },
          icon: 'object:backup-job',
        }),
    }
  },
})
</script>

<style lang="postcss" scoped>
.backup-head {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .protection-infos {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
}
</style>
