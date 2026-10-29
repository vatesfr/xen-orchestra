<template>
  <VtsTabularKeyValueList v-if="form.hasStorageTargetChoice.value">
    <VtsTabularKeyValueRow :label="t('storage-target')" :value="storageTargetsLabel" />
  </VtsTabularKeyValueList>

  <template v-if="form.hasBackupRepositorySection.value">
    <BackupJobReviewSubtitle>{{ t('backup-repositories') }}</BackupJobReviewSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('target-proxy')" :value="targetProxy?.name" />
      <VtsTabularKeyValueRow
        :label="t('scope-type')"
        :value="getOptionLabel(bindings.backupRepositoryScopeType.options, formData.backupRepositoryScopeType)"
      />
      <VtsTabularKeyValueRow
        v-if="form.hasRetentionStrategy.value"
        :label="t('backup-distribution-strategy')"
        :value="getOptionLabel(bindings.backupDistribution.options, formData.backupDistribution)"
      />
      <VtsTabularKeyValueRow :label="t('minimum-backups-to-retain')" :value="toText(formData.exportRetention)" />
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
      <VtsTabularKeyValueRow
        :label="t('scope-type')"
        :value="getOptionLabel(bindings.storageRepositoryScopeType.options, formData.storageRepositoryScopeType)"
      />
      <VtsTabularKeyValueRow
        :label="t('replica-distribution-strategy')"
        :value="getOptionLabel(bindings.replicaDistribution.options, formData.replicaDistribution)"
      />
      <VtsTabularKeyValueRow :label="t('minimum-replicas-to-retain')" :value="toText(formData.copyRetention)" />
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
        <VtsTabularKeyValueRow
          :label="t('health-check-frequency')"
          :value="getOptionLabel(bindings.healthCheckSchedule.options, formData.healthCheckSchedule)"
        />
        <template v-if="formData.healthCheckSchedule === 'dynamic'">
          <VtsTabularKeyValueRow
            :label="t('days-of-the-month')"
            :value="getSelectedLabels(bindings.healthCheckMonthDays)"
          />
          <VtsTabularKeyValueRow
            :label="t('days-of-the-week')"
            :value="getSelectedLabels(bindings.healthCheckWeekDays)"
          />
          <VtsTabularKeyValueRow :label="t('hours')" :value="getSelectedLabels(bindings.healthCheckHours)" />
        </template>
      </template>
    </VtsTabularKeyValueList>
  </template>
</template>

<script lang="ts" setup>
import BackupJobReviewSubtitle from '@/modules/backup-job/components/form/review/BackupJobReviewSubtitle.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import { getOptionLabel, getSelectedLabels } from '@/modules/backup-job/utils/backup-job-form.util.ts'
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

const bindings = computed(() => form.bindings)

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

function toText(value: number | undefined): string | undefined {
  return value === undefined ? undefined : String(value)
}

const storageTargetsLabel = computed(() =>
  form.formData.storageTargets.length === 0
    ? t('none')
    : form.formData.storageTargets
        .map(target => getOptionLabel(form.bindings.storageTargets.options, target))
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
.lines {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
