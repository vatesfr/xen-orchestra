<template>
  <VtsTabularKeyValueList class="backup-job-review-planning">
    <BackupJobReviewRow
      :label="t('resulting-expression')"
      :value="form.formData.cron"
      :overridden="isOverridden('cron')"
    />
    <BackupJobReviewRow :label="t('timezone')" :value="form.formData.timezone" :overridden="isOverridden('timezone')" />
    <VtsTabularKeyValueRow :label="t('next-runs')">
      <template #value>
        <div class="lines">
          <span v-for="run of nextRuns" :key="run.date.getTime()">{{ run.label }}</span>
        </div>
      </template>
    </VtsTabularKeyValueRow>
    <template v-if="!isMetadata">
      <BackupJobReviewRow :label="t('timeout')" :value="timeout" :overridden="isOverridden('timeout')" />
      <BackupJobReviewRow
        :label="t('vm-backup-failure-number-of-retries')"
        :value="form.formData.nRetriesVmBackupFailures?.toString()"
        :overridden="isOverridden('nRetriesVmBackupFailures')"
      />
    </template>
    <BackupJobReviewRow :label="t('report-when')" :value="reportWhenLabel" :overridden="isOverridden('reportWhen')" />
    <BackupJobReviewRow :label="t('report-recipients')" :overridden="isOverridden('reportRecipients')">
      <div class="lines">
        <span v-for="recipient of form.formData.reportRecipients" :key="recipient">{{ recipient }}</span>
      </div>
    </BackupJobReviewRow>
    <BackupJobReviewRow :label="t('hide-successful-items')" :overridden="isOverridden('hideSuccessfulItems')">
      <VtsStatus :status="form.formData.hideSuccessfulItems" />
    </BackupJobReviewRow>
  </VtsTabularKeyValueList>
</template>

<script lang="ts" setup>
import BackupJobReviewRow from '@/modules/backup-job/components/form/review/BackupJobReviewRow.vue'
import { useBackupJobReviewChanges } from '@/modules/backup-job/composables/use-backup-job-review-changes.composable.ts'
import type {
  BackupJobPlanningForm,
  BackupJobPlanningFormData,
} from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import { useScheduleNextRuns } from '@/modules/schedule/composables/use-schedule-next-runs.composable.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { formatTimeout } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form, saved } = defineProps<{
  form: BackupJobPlanningForm
  saved?: BackupJobPlanningFormData
  isMetadata: boolean
}>()

const { t, locale } = useI18n()

const { isOverridden } = useBackupJobReviewChanges(
  () => form.formData,
  () => saved
)

const timeout = computed(() =>
  formatTimeout(form.formData.timeout === undefined ? undefined : form.formData.timeout * 3600e3, locale.value)
)

const reportWhenLabel = computed(() => form.getReportWhenLabel(form.formData.reportWhen))

const nextRuns = useScheduleNextRuns(
  () => form.formData.cron,
  () => form.formData.timezone
)
</script>

<style lang="postcss" scoped>
.backup-job-review-planning {
  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
