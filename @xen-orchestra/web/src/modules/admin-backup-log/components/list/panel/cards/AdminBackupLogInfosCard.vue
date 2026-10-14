<template>
  <UiPanelCard class="admin-backup-log-infos-card">
    <UiPanelCardTitle
      :id="backupLog.id"
      size="medium"
      :label="t('log-name', { date: formattedStartDate })"
      :href="logHref"
      icon="object:backup-log"
    />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('type') }}</template>
        <template #value>{{ type }}</template>
        <template #addons>
          <VtsCopyButton :value="type" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('backup-date') }}</template>
        <template #value>{{ formattedStartDate }}</template>
        <template #addons>
          <VtsCopyButton :value="formattedStartDate" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('duration') }}</template>
        <template #value>{{ duration }}</template>
        <template v-if="duration !== undefined" #addons>
          <VtsCopyButton :value="duration" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="vms.length > 0">
        <VtsCardRowKeyValue v-for="(vm, index) in vms" :key="index">
          <template #key>
            <template v-if="index === 0">{{ t('vm') }}</template>
          </template>
          <template #value>
            <UiLink
              v-if="vm !== undefined"
              size="small"
              :icon="objectIcon('vm', toLower(vm.power_state))"
              :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }"
            >
              {{ vm.name_label }}
            </UiLink>
            <UiInfo v-else accent="warning">{{ t('vm-not-found') }}</UiInfo>
          </template>
          <template v-if="vm !== undefined" #addons>
            <VtsCopyButton :value="vm.name_label" />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('vm') }}</template>
        <template #value />
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('job') }}</template>
        <template #value>
          <UiLink size="small" icon="object:backup-job" :href="jobHref">
            {{ job?.name ?? t('untitled') }}
          </UiLink>
        </template>
        <template v-if="job?.name" #addons>
          <VtsCopyButton :value="job.name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('run') }}</template>
        <template #value>
          <UiLink size="small" icon="object:backup-run" :to="runRoute">
            {{ formattedStartDate }}
          </UiLink>
        </template>
        <template #addons>
          <VtsCopyButton :value="formattedStartDate" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="srs.length > 0">
        <VtsCardRowKeyValue v-for="({ id, sr }, index) in srs" :key="id">
          <template #key>
            <template v-if="index === 0">{{ t('sr') }}</template>
          </template>
          <template #value>
            <UiLink
              v-if="sr !== undefined"
              size="small"
              :icon="getSrStatusIcon(sr)"
              :to="{ name: '/sr/[id]/general', params: { id: sr.id } }"
            >
              {{ sr.name_label }}
            </UiLink>
            <template v-else>{{ id }}</template>
          </template>
          <template #addons>
            <VtsCopyButton :value="sr?.name_label ?? id" />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('sr') }}</template>
        <template #value />
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="backupLog.status" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupLogsUtils } from '@/modules/backup/composables/xo-backup-log-utils.composable.ts'
import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { objectIcon } from '@core/icons'
import { formatDate } from '@vueuse/core'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationAsRelative } from 'vue-router'

const { backupLog } = defineProps<{
  backupLog: FrontXoBackupLog
}>()

const { t } = useI18n()

// TODO: replace with the real type
const type = 'run'

const { buildXo5Route } = useXoRoutes()

const { getBackupJobById } = useXoBackupJobCollection()

const { getVmById } = useXoVmCollection()

const { getSrById } = useXoSrCollection()

const { getSrStatusIcon } = useXoSrUtils()

const { getBackupLogDuration } = useXoBackupLogsUtils()

const formattedStartDate = computed(() => formatDate(new Date(backupLog.start), 'YYYY-MM-DD HH:mm:ss'))

const duration = computed(() => getBackupLogDuration(backupLog))

const job = computed(() => (backupLog.jobId !== undefined ? getBackupJobById(backupLog.jobId) : undefined))

const jobHref = computed(() => buildXo5Route(`/backup/${backupLog.jobId}/edit`))

const logHref = computed(() => buildXo5Route(`/backup/overview?s_logs=1_0_asc-${backupLog.id}`))

const runRoute = computed<RouteLocationAsRelative | undefined>(() => {
  if (backupLog.jobId === undefined) {
    return undefined
  }

  return {
    name: '/backup/[id]/runs',
    params: { id: backupLog.jobId },
    query: { id: backupLog.id },
  }
})

const vmTasks = computed(() => (backupLog.tasks ?? []).filter(task => task.data?.type === 'VM'))

const vms = computed(() => vmTasks.value.map(vmTask => getVmById(vmTask.data!.id as FrontXoVm['id'])))

const srs = computed(() =>
  [
    ...new Set(
      vmTasks.value.flatMap(vmTask =>
        (vmTask.tasks ?? []).filter(task => task.data?.type === 'SR').map(task => task.data!.id as FrontXoSr['id'])
      )
    ),
  ].map(id => ({ id, sr: getSrById(id) }))
)
</script>

<style scoped lang="postcss">
.admin-backup-log-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
