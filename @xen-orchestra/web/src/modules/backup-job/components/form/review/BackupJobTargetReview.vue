<template>
  <div class="backup-job-target-review">
    <VtsTabularKeyValueList v-if="form.hasStorageTargetChoice.value">
      <VtsTabularKeyValueRow :label="t('storage-target')" :value="storageTargetsLabel" />
    </VtsTabularKeyValueList>

    <template v-if="form.hasBackupRepositorySection.value">
      <BackupJobReviewSubtitle>{{ t('backup-repositories') }}</BackupJobReviewSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('target-proxy')" :value="targetProxy?.name" />
        <VtsTabularKeyValueRow :label="t('scope-type')" :value="backupRepositoryScopeTypeLabel" />
        <VtsTabularKeyValueRow
          v-if="form.hasRetentionStrategy.value"
          :label="t('backup-distribution-strategy')"
          :value="backupDistributionLabel"
        />
        <VtsTabularKeyValueRow :label="t('minimum-backups-to-retain')" :value="formData.exportRetention?.toString()" />
        <template v-if="form.hasRetentionStrategy.value">
          <VtsTabularKeyValueRow :label="t('long-term-retention')">
            <template #value>
              <div class="lines">
                <span v-for="line of longTermRetentionLines" :key="line">{{ line }}</span>
              </div>
            </template>
          </VtsTabularKeyValueRow>
          <VtsTabularKeyValueRow v-if="form.hasStrictGfs.value" :label="t('enforce-strict-gfs-hierarchy')">
            <template #value>
              <VtsStatus :status="formData.strictGfs" />
            </template>
          </VtsTabularKeyValueRow>
          <VtsTabularKeyValueRow :label="t('merge-backups-synchronously')">
            <template #value>
              <VtsStatus :status="formData.mergeBackupsSynchronously" />
            </template>
          </VtsTabularKeyValueRow>
        </template>
      </VtsTabularKeyValueList>
    </template>

    <template v-if="form.hasStorageRepositorySection.value">
      <BackupJobReviewSubtitle>{{ t('storage-repositories') }}</BackupJobReviewSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('scope-type')" :value="storageRepositoryScopeTypeLabel" />
        <VtsTabularKeyValueRow :label="t('replica-distribution-strategy')" :value="replicaDistributionLabel" />
        <VtsTabularKeyValueRow :label="t('minimum-replicas-to-retain')" :value="formData.copyRetention?.toString()" />
      </VtsTabularKeyValueList>
    </template>

    <template v-if="form.hasHealthCheckSection.value">
      <BackupJobReviewSubtitle>{{ t('health-check') }}</BackupJobReviewSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('enable-health-check')">
          <template #value>
            <VtsStatus :status="formData.healthCheckEnabled" />
          </template>
        </VtsTabularKeyValueRow>
        <template v-if="formData.healthCheckEnabled">
          <VtsTabularKeyValueRow :label="t('health-check-sr')" :value="healthCheckSrName" />
          <VtsTabularKeyValueRow :label="t('timeout')" :value="healthCheckTimeout" />
          <VtsTabularKeyValueRow :label="t('health-check-vm-tags')" :value="healthCheckVmTagsLabel" />
          <VtsTabularKeyValueRow :label="t('health-check-frequency')" :value="healthCheckScheduleLabel" />
          <template v-if="formData.healthCheckSchedule === 'dynamic'">
            <VtsTabularKeyValueRow :label="t('days-of-the-month')" :value="healthCheckMonthDaysLabel" />
            <VtsTabularKeyValueRow :label="t('days-of-the-week')" :value="healthCheckWeekDaysLabel" />
            <VtsTabularKeyValueRow :label="t('hours')" :value="healthCheckHoursLabel" />
          </template>
        </template>
      </VtsTabularKeyValueList>
    </template>
  </div>
</template>

<script lang="ts" setup>
import BackupJobReviewSubtitle from '@/modules/backup-job/components/form/review/BackupJobReviewSubtitle.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import { formatOptionLabel, formatSelectedLabels } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobTargetForm
}>()

const { t } = useI18n()

const formData = computed(() => form.formData)

const { useGetProxyById } = useXoProxyCollection()

const targetProxy = useGetProxyById(() => form.formData.targetProxy)

const { getSrById } = useXoSrCollection()

const healthCheckSrName = computed(() =>
  form.formData.healthCheckSr === undefined ? undefined : getSrById(form.formData.healthCheckSr)?.name_label
)

const healthCheckTimeout = computed(() =>
  form.formData.healthCheckTimeout === undefined ? undefined : `${form.formData.healthCheckTimeout} ${t('minutes')}`
)

const healthCheckVmTagsLabel = computed(() =>
  form.formData.healthCheckVmTags.length === 0 ? t('all-vms') : form.formData.healthCheckVmTags.join(', ')
)

const backupRepositoryScopeTypeLabel = computed(() =>
  formatOptionLabel(form.bindings.backupRepositoryScopeType.options, form.formData.backupRepositoryScopeType)
)

const backupDistributionLabel = computed(() =>
  formatOptionLabel(form.bindings.backupDistribution.options, form.formData.backupDistribution)
)

const storageRepositoryScopeTypeLabel = computed(() =>
  formatOptionLabel(form.bindings.storageRepositoryScopeType.options, form.formData.storageRepositoryScopeType)
)

const replicaDistributionLabel = computed(() =>
  formatOptionLabel(form.bindings.replicaDistribution.options, form.formData.replicaDistribution)
)

const healthCheckScheduleLabel = computed(() =>
  formatOptionLabel(form.bindings.healthCheckSchedule.options, form.formData.healthCheckSchedule)
)

const healthCheckMonthDaysLabel = computed(() =>
  formatSelectedLabels(form.bindings.healthCheckMonthDays.options, form.formData.healthCheckMonthDays)
)

const healthCheckWeekDaysLabel = computed(() =>
  formatSelectedLabels(form.bindings.healthCheckWeekDays.options, form.formData.healthCheckWeekDays)
)

const healthCheckHoursLabel = computed(() =>
  formatSelectedLabels(form.bindings.healthCheckHours.options, form.formData.healthCheckHours)
)

const storageTargetsLabel = computed(() =>
  form.formData.storageTargets.length === 0
    ? t('none')
    : form.formData.storageTargets
        .map(target => formatOptionLabel(form.bindings.storageTargets.options, target))
        .filter(label => label !== undefined)
        .join(', ')
)

const longTermRetentionLines = computed(() =>
  (
    [
      ['daily', form.formData.ltrDailyRetention, form.formData.ltrDailyKeep],
      ['weekly', form.formData.ltrWeeklyRetention, form.formData.ltrWeeklyKeep],
      ['monthly', form.formData.ltrMonthlyRetention, form.formData.ltrMonthlyKeep],
      ['yearly', form.formData.ltrYearlyRetention, form.formData.ltrYearlyKeep],
    ] as const
  )
    .filter(([, retention]) => retention !== undefined && retention > 0)
    .map(([period, retention, keep]) =>
      t('long-term-retention:row', {
        count: retention,
        period: t(`long-term-retention:${period}`),
        keep: form.getKeepLabel(period, keep),
      })
    )
)
</script>

<style lang="postcss" scoped>
.backup-job-target-review {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
