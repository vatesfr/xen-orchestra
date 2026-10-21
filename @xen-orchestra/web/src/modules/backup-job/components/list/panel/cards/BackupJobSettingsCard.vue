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
      <template v-if="hasTransferSettings">
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
          <template #value>{{ formattedMaxExportRate }}</template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue>
        <template #key>{{ t('report-when') }}</template>
        <template #value>{{ reportWhenValueTranslation }}</template>
        <template #addons>
          <VtsCopyButton :value="reportWhenValueTranslation" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="reportRecipients.length > 0">
        <VtsCardRowKeyValue v-for="(recipient, index) in visibleReportRecipients" :key="recipient" align-top>
          <template #key>
            <template v-if="index === 0">{{ t('report-recipients') }}</template>
          </template>
          <template #value>{{ recipient }}</template>
          <template #addons>
            <VtsCopyButton :value="recipient" />
            <VtsCopyAllMenuItem v-if="index === 0 && reportRecipients.length > 1" :values="reportRecipients" />
          </template>
        </VtsCardRowKeyValue>
        <UiButton
          v-if="hiddenReportRecipientsCount > 0"
          class="see-more"
          size="small"
          accent="brand"
          variant="tertiary"
          @click="toggleReportRecipients()"
        >
          {{
            areReportRecipientsExpanded
              ? t('action:see-less')
              : t('action:see-n-more', { n: hiddenReportRecipientsCount })
          }}
        </UiButton>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('report-recipients') }}</template>
        <template #value />
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="hasTransferSettings">
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
      <VtsCardRowKeyValue v-if="hasTransferSettings">
        <template #key>{{ t('merge-backups-synchronously') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.mergeBackupsSynchronously" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupJobSettings } from '@/modules/backup-job/composables/use-xo-backup-job-settings.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { hasBackupJobSnapshotRetention } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useToggle } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const {
  compression,
  formattedTimeout,
  formattedMaxExportRate,
  proxy,
  reportWhenValueTranslation,
  settings,
  snapshotModeTranslation,
} = useXoBackupJobSettings(() => backupJob)

const isVmBackupJob = computed(() => backupJob.type === 'backup')

const hasTransferSettings = computed(() => backupJob.type === 'backup' || backupJob.type === 'mirrorBackup')

const canSetCompression = computed(() => backupJob.type === 'backup' && backupJob.mode === 'full')

const canSetOfflineBackup = computed(() => backupJob.type === 'backup' && !hasBackupJobSnapshotRetention(backupJob))

const VISIBLE_REPORT_RECIPIENTS_COUNT = 5

const [areReportRecipientsExpanded, toggleReportRecipients] = useToggle(false)

const reportRecipients = computed(() => settings.reportRecipients ?? [])

const hiddenReportRecipientsCount = computed(() =>
  Math.max(reportRecipients.value.length - VISIBLE_REPORT_RECIPIENTS_COUNT, 0)
)

const visibleReportRecipients = computed(() =>
  areReportRecipientsExpanded.value
    ? reportRecipients.value
    : reportRecipients.value.slice(0, VISIBLE_REPORT_RECIPIENTS_COUNT)
)
</script>

<style scoped lang="postcss">
.backup-job-settings-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .see-more {
      align-self: center;
    }
  }
}
</style>
