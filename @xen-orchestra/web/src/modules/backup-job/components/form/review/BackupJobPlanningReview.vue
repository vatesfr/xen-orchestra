<template>
  <VtsTabularKeyValueList class="backup-job-planning-review">
    <VtsTabularKeyValueRow :label="t('enabled')">
      <template #value>
        <VtsStatus :status="form.formData.enabled" />
      </template>
    </VtsTabularKeyValueRow>
    <VtsTabularKeyValueRow :label="t('resulting-expression')" :value="form.formData.cron" />
    <VtsTabularKeyValueRow :label="t('time-zone')" :value="form.formData.timezone" />
    <VtsTabularKeyValueRow :label="t('next-runs')">
      <template #value>
        <div class="lines">
          <span v-for="run of nextRuns" :key="run.date.getTime()">{{ run.label }}</span>
        </div>
      </template>
    </VtsTabularKeyValueRow>
    <template v-if="!isMetadata">
      <VtsTabularKeyValueRow :label="t('timeout')" :value="timeout" />
      <VtsTabularKeyValueRow
        :label="t('vm-backup-failure-number-of-retries')"
        :value="form.formData.nRetriesVmBackupFailures?.toString()"
      />
    </template>
    <VtsTabularKeyValueRow :label="t('report-when')" :value="reportWhenLabel" />
    <VtsTabularKeyValueRow :label="t('report-recipients')">
      <template #value>
        <div class="lines">
          <span v-for="recipient of form.formData.reportRecipients" :key="recipient">{{ recipient }}</span>
        </div>
      </template>
    </VtsTabularKeyValueRow>
    <VtsTabularKeyValueRow :label="t('hide-successful-items')">
      <template #value>
        <VtsStatus :status="form.formData.hideSuccessfulItems" />
      </template>
    </VtsTabularKeyValueRow>
  </VtsTabularKeyValueList>
</template>

<script lang="ts" setup>
import type { BackupJobPlanningForm } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import { formatOptionLabel } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { useScheduleNextRuns } from '@/modules/schedule/composables/use-schedule-next-runs.composable.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobPlanningForm
  isMetadata: boolean
}>()

const { t } = useI18n()

const timeout = computed(() =>
  form.formData.timeout === undefined ? undefined : `${form.formData.timeout} ${t('hours')}`
)

const reportWhenLabel = computed(() => formatOptionLabel(form.bindings.reportWhen.options, form.formData.reportWhen))

const nextRuns = useScheduleNextRuns(
  () => form.formData.cron,
  () => form.formData.timezone
)
</script>

<style lang="postcss" scoped>
.backup-job-planning-review {
  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
