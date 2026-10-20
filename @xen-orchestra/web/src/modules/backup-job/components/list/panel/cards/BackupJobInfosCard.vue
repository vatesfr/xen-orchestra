<template>
  <UiPanelCard class="backup-job-infos-card">
    <UiPanelCardTitle
      :id="backupJob.id"
      size="medium"
      :label="backupJob.name ?? t('untitled')"
      :href="jobOverviewHref"
      icon="object:backup-job"
    />
    <div class="content">
      <VtsCardRowKeyValue v-for="(typeLabel, index) in typeLabels" :key="typeLabel">
        <template #key>
          <template v-if="index === 0">{{ t('type') }}</template>
        </template>
        <template #value>{{ typeLabel }}</template>
        <template #addons>
          <VtsCopyButton :value="typeLabel" />
          <VtsCopyAllMenuItem v-if="index === 0 && typeLabels.length > 1" :values="typeLabels" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('mode') }}</template>
        <template #value>{{ modeLabel }}</template>
        <template v-if="modeLabel" #addons>
          <VtsCopyButton :value="modeLabel" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="healthCheckStatus !== undefined">
        <VtsCardRowKeyValue>
          <template #key>{{ t('health-check') }}</template>
          <template #value>
            <VtsStatus :status="healthCheckStatus" />
          </template>
        </VtsCardRowKeyValue>
        <template v-if="healthCheckSrs.length > 0">
          <VtsCardRowKeyValue v-for="({ id, sr, icon }, index) in healthCheckSrs" :key="id">
            <template #key>
              <template v-if="index === 0">{{ t('health-check-sr') }}</template>
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
          <template #key>{{ t('health-check-sr') }}</template>
          <template #value />
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupJobModeLabel } from '@/modules/backup-job/composables/use-xo-backup-job-mode-label.composable.ts'
import { useXoBackupJobTypeLabels } from '@/modules/backup-job/composables/use-xo-backup-job-type-labels.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import {
  getBackupJobHealthCheckSrIds,
  getBackupJobHealthCheckStatus,
} from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { getSrById } = useXoSrCollection()

const { getSrStatusIcon } = useXoSrUtils()

const jobOverviewHref = computed(() => buildXo5Route('/backup/overview'))

const typeLabels = useXoBackupJobTypeLabels(() => backupJob)

const modeLabel = useXoBackupJobModeLabel(() => backupJob)

const healthCheckStatus = computed(() => getBackupJobHealthCheckStatus(backupJob))

const healthCheckSrs = computed(() =>
  getBackupJobHealthCheckSrIds(backupJob).map(id => {
    const sr = getSrById(id)

    return { id, sr, icon: sr !== undefined ? getSrStatusIcon(sr) : undefined }
  })
)
</script>

<style scoped lang="postcss">
.backup-job-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
