<template>
  <UiPanelCard class="backup-log-infos-card">
    <UiPanelCardTitle :id="backupLog.id" size="medium" :label="logName" :href="logHref" icon="object:backup-run" />
    <div class="content">
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
        <VtsCardRowKeyValue v-for="({ id, vm, icon }, index) in vms" :key="id">
          <template #key>
            <template v-if="index === 0">{{ t('vm') }}</template>
          </template>
          <template #value>
            <UiLink
              v-if="vm !== undefined"
              size="small"
              :icon
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
        <template #value>
          <UiInfo v-if="job?.type === 'backup'" accent="warning">{{ t('vm-not-found') }}</UiInfo>
        </template>
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
      <template v-if="srs.length > 0">
        <VtsCardRowKeyValue v-for="({ id, sr, icon }, index) in srs" :key="id">
          <template #key>
            <template v-if="index === 0">{{ t('sr') }}</template>
          </template>
          <template #value>
            <UiLink
              v-if="sr !== undefined"
              size="small"
              :icon
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
import { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogsUtils } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { getBackupLogSrIds, getBackupLogVmIds } from '@/modules/backup-log/utils/xo-backup-log.util.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
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
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{
  backupLog: FrontXoBackupLog
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetBackupJobById } = useXoBackupJobCollection()

const { getVmById } = useXoVmCollection()

const { getSrById } = useXoSrCollection()

const { getSrStatusIcon } = useXoSrUtils()

const { getBackupLogDate, getBackupLogDuration } = useXoBackupLogsUtils()

const formattedStartDate = computed(() => getBackupLogDate(backupLog.start))

const logName = computed(() => t('log-name', { date: formattedStartDate.value }))

const duration = computed(() => getBackupLogDuration(backupLog))

const job = useGetBackupJobById(() => backupLog.jobId)

const jobHref = computed(() => buildXo5Route('/settings/remotes'))

const logHref = computed(() => buildXo5Route('/settings/remotes'))

const vms = computed(() =>
  getBackupLogVmIds(backupLog).map(id => {
    const vm = getVmById(id)

    return { id, vm, icon: vm !== undefined ? objectIcon('vm', toLower(vm.power_state)) : undefined }
  })
)

const srs = computed(() =>
  getBackupLogSrIds(backupLog).map(id => {
    const sr = getSrById(id)

    return { id, sr, icon: sr !== undefined ? getSrStatusIcon(sr) : undefined }
  })
)
</script>

<style scoped lang="postcss">
.backup-log-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
