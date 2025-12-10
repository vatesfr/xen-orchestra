<template>
  <UiCard>
    <UiCardTitle>
      {{ t('last-n-backup-runs', 3) }}
      <template #info>
        <UiLink size="small" :to="`/vm/${id}/backups`">{{ t('backup-jobs:see-all') }}</UiLink>
      </template>
    </UiCardTitle>
    <VtsQuickInfoRow :label="t('protection-status')">
      <template #value>
        <UiInfo :accent="infoAccent">{{ infoText }}</UiInfo>
      </template>
    </VtsQuickInfoRow>
    <!-- For a link to be active, the `to` attribute must be defined. -->
    <UiLink class="protection-helper" icon="legacy:status:info" size="small" to="#" @click="openProtectionHelpModal()">
      {{ t('what-does-protected-means') }}
    </UiLink>
    <VtsTable :state>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="run of lastRuns" :key="run.backupJobId">
          <BodyCells :item="run" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import type { VmDashboardRun, XoVmDashboard } from '@/types/xo/vm-dashboard.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useModal } from '@core/packages/modal/use-modal'
import { useBackupRunColumns } from '@core/tables/column-sets/vm-backup-run'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const { error, vmDashboard } = defineProps<{
  vmDashboard: XoVmDashboard | undefined
  error: boolean
}>()
const { t } = useI18n()

const openProtectionHelpModal = useModal(() => ({
  component: import('@/components/modals/VmProtectedHelper.vue'),
}))

const { getBackupJobById, areBackupJobsFetching, hasBackupJobFetchError } = useXoBackupJobCollection()

const id = computed(() => vmDashboard?.quickInfo.id)

const lastRuns = computed(() => vmDashboard?.backupsInfo.lastRuns ?? [])

const isEmpty = computed(() => lastRuns.value.length === 0)

const infoAccent = computed(() => {
  if (vmDashboard?.backupsInfo.vmProtection === 'not-in-job') {
    return 'danger'
  } else if (vmDashboard?.backupsInfo.vmProtection === 'unprotected') {
    return 'warning'
  } else {
    return 'success'
  }
})

const infoText = computed(() => {
  if (vmDashboard?.backupsInfo.vmProtection === 'not-in-job') {
    return t('backups:vms-protection:no-active-job')
  } else if (vmDashboard?.backupsInfo.vmProtection === 'unprotected') {
    return t('backups:vms-protection:active-unprotected')
  } else {
    return t('backups:vms-protection:active-protected')
  }
})

const state = reactive(
  useTableState({
    error: hasBackupJobFetchError || error,
    busy: areBackupJobsFetching || !vmDashboard,
    empty: () => isEmpty.value,
  })
)

const { HeadCells, BodyCells } = useBackupRunColumns({
  body: (run: VmDashboardRun) => {
    return {
      date: r => r(run.timestamp),
      BackupArchiveStatus: r => r({ status: run.status }),
      BackupJob: r =>
        r({
          label: getBackupJobById(run.backupJobId)?.name ?? run.backupJobId,
          to: `/backup/${run.backupJobId}`,
          icon: 'object:backup-job',
        }),
    }
  },
})
</script>

<style lang="postcss" scoped>
.protection-helper {
  width: fit-content;
}
</style>
