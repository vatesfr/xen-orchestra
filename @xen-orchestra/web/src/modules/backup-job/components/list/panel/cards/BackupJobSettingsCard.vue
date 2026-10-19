<template>
  <UiPanelCard class="backup-job-settings-card">
    <UiPanelCardTitle size="medium" :label="t('settings')" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('proxy') }}</template>
        <template #value>{{ proxy?.name }}</template>
        <template v-if="proxy !== undefined" #addons>
          <VtsCopyButton :value="proxy.name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="isVmBackupJob">
        <template #key>{{ t('snapshot-mode') }}</template>
        <template #value>
          <UiTag accent="info" variant="secondary">{{ snapshotModeTranslation }}</UiTag>
        </template>
        <template #addons>
          <VtsCopyButton :value="snapshotModeTranslation" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="hasVmBackupSettings">
        <VtsCardRowKeyValue>
          <template #key>{{ t('vm-backup-failure-number-of-retries') }}</template>
          <template #value>{{ settings.nRetriesVmBackupFailures }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('timeout') }}</template>
          <template #value>{{ formattedTimeout }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('speed-limit') }}</template>
          <template v-if="maxExportRate !== undefined" #value>
            {{ `${maxExportRate.value} ${maxExportRate.prefix}` }}
          </template>
          <template v-else #value />
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue>
        <template #key>{{ t('report-when') }}</template>
        <template #value>{{ reportWhenValueTranslation }}</template>
        <template #addons>
          <VtsCopyButton :value="reportWhenValueTranslation" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('report-recipients') }}</template>
        <template #value>
          <UiCollapsibleList v-if="reportRecipients.length > 0" tag="ul" :total-items="reportRecipients.length">
            <li v-for="recipient in reportRecipients" :key="recipient" class="recipient">
              <span class="text-ellipsis">{{ recipient }}</span>
              <VtsCopyButton :value="recipient" />
            </li>
          </UiCollapsibleList>
        </template>
        <template v-if="reportRecipients.length > 1" #addons>
          <VtsCopyAllMenuItem :values="reportRecipients" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="hasVmBackupSettings">
        <template #key>{{ t('concurrency') }}</template>
        <template #value>{{ settings.concurrency }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="canSetCompression">
        <template #key>{{ t('compression') }}</template>
        <template #value>
          <template v-if="compression !== undefined">{{ compression }}</template>
          <VtsStatus v-else :status="false" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="canSetOfflineBackup">
        <template #key>{{ t('offline-backup') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.offlineBackup" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('shorter-backup-reports') }}</template>
        <template #value>
          <VtsStatus :status="settings.backupReportTpl === 'compactMjml'" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="hasVmBackupSettings">
        <template #key>{{ t('merge-backups-synchronously') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.mergeBackupsSynchronously" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupJobSettingsUtils } from '@/modules/backup-job/composables/use-xo-backup-job-settings.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const {
  compression,
  formattedTimeout,
  maxExportRate,
  proxy,
  reportWhenValueTranslation,
  settings,
  snapshotModeTranslation,
} = useXoBackupJobSettingsUtils(() => backupJob)

const isVmBackupJob = computed(() => backupJob.type === 'backup')

const hasVmBackupSettings = computed(() => backupJob.type === 'backup' || backupJob.type === 'mirrorBackup')

const canSetCompression = computed(() => backupJob.type === 'backup' && backupJob.mode === 'full')

const canSetOfflineBackup = computed(
  () =>
    backupJob.type === 'backup' &&
    !Object.values(backupJob.settings).some(settings => Number(settings?.snapshotRetention) > 0)
)

const reportRecipients = computed(() => settings.reportRecipients ?? [])
</script>

<style scoped lang="postcss">
.backup-job-settings-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value:empty::before {
      content: '-';
    }

    .recipient {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.8rem;
    }
  }
}
</style>
