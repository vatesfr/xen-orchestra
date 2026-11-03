<template>
  <div class="backup-job-review-target">
    <VtsTabularKeyValueList v-if="form.hasStorageTargetChoice.value">
      <VtsTabularKeyValueRow :label="t('storage-target')" :value="storageTargetsLabel" />
    </VtsTabularKeyValueList>

    <template v-if="form.hasBackupRepositorySection.value">
      <UiSubtitle>{{ t('backup-repositories') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('target-proxy')" :value="targetProxy?.name" />
        <VtsTabularKeyValueRow :label="t('scope-type')" :value="backupRepositoryScopeTypeLabel" />
        <VtsTabularKeyValueRow
          v-if="form.hasRetentionStrategy.value"
          :label="t('backup-distribution-strategy')"
          :value="backupDistributionLabel"
        />
        <VtsTabularKeyValueRow
          :label="t('minimum-backups-to-retain')"
          :value="backupRepository.formData.exportRetention?.toString()"
        />
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
              <VtsStatus :status="backupRepository.formData.strictGfs" />
            </template>
          </VtsTabularKeyValueRow>
          <VtsTabularKeyValueRow :label="t('merge-backups-synchronously')">
            <template #value>
              <VtsStatus :status="backupRepository.formData.mergeBackupsSynchronously" />
            </template>
          </VtsTabularKeyValueRow>
        </template>
      </VtsTabularKeyValueList>
    </template>

    <template v-if="form.hasStorageRepositorySection.value">
      <UiSubtitle>{{ t('storage-repositories') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('scope-type')" :value="storageRepositoryScopeTypeLabel" />
        <VtsTabularKeyValueRow :label="t('replica-distribution-strategy')" :value="replicaDistributionLabel" />
        <VtsTabularKeyValueRow
          :label="t('minimum-replicas-to-retain')"
          :value="storageRepository.formData.copyRetention?.toString()"
        />
      </VtsTabularKeyValueList>
    </template>

    <template v-if="form.hasHealthCheckSection.value">
      <UiSubtitle>{{ t('health-check') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('enable-health-check')">
          <template #value>
            <VtsStatus :status="healthCheck.formData.healthCheckEnabled" />
          </template>
        </VtsTabularKeyValueRow>
        <template v-if="healthCheck.formData.healthCheckEnabled">
          <VtsTabularKeyValueRow :label="t('health-check-sr')" :value="healthCheckSrName" />
          <VtsTabularKeyValueRow :label="t('timeout')" :value="healthCheckTimeout" />
          <VtsTabularKeyValueRow :label="t('health-check-vm-tags')" :value="healthCheckVmTagsLabel" />
          <VtsTabularKeyValueRow :label="t('health-check-frequency')" :value="healthCheckScheduleLabel" />
          <BackupJobReviewCalendarRows
            v-if="healthCheck.formData.healthCheckSchedule === 'dynamic'"
            :month-days="healthCheck.bindings.healthCheckMonthDays"
            :week-days="healthCheck.bindings.healthCheckWeekDays"
            :hours="healthCheck.bindings.healthCheckHours"
          />
        </template>
      </VtsTabularKeyValueList>
    </template>
  </div>
</template>

<script lang="ts" setup>
import BackupJobReviewCalendarRows from '@/modules/backup-job/components/form/review/BackupJobReviewCalendarRows.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import { LONG_TERM_RETENTION_FIELDS } from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobTargetForm
}>()

const { t } = useI18n()

const { backupRepository, storageRepository, healthCheck } = form

const { useGetProxyById } = useXoProxyCollection()

const targetProxy = useGetProxyById(() => backupRepository.formData.targetProxy)

const { getSrById } = useXoSrCollection()

const healthCheckSrName = computed(() =>
  healthCheck.formData.healthCheckSr === undefined
    ? undefined
    : getSrById(healthCheck.formData.healthCheckSr)?.name_label
)

const healthCheckTimeout = computed(() =>
  healthCheck.formData.healthCheckTimeout === undefined
    ? undefined
    : `${healthCheck.formData.healthCheckTimeout} ${t('cron:unit:minute')}`
)

const healthCheckVmTagsLabel = computed(() =>
  healthCheck.formData.healthCheckVmTags.length === 0 ? t('all-vms') : healthCheck.formData.healthCheckVmTags.join(', ')
)

const backupRepositoryScopeTypeLabel = computed(() =>
  backupRepository.getScopeTypeLabel(backupRepository.formData.backupRepositoryScopeType)
)

const backupDistributionLabel = computed(() =>
  backupRepository.getDistributionLabel(backupRepository.formData.backupDistribution)
)

const storageRepositoryScopeTypeLabel = computed(() =>
  storageRepository.getScopeTypeLabel(storageRepository.formData.storageRepositoryScopeType)
)

const replicaDistributionLabel = computed(() =>
  storageRepository.getDistributionLabel(storageRepository.formData.replicaDistribution)
)

const healthCheckScheduleLabel = computed(() => healthCheck.getScheduleLabel(healthCheck.formData.healthCheckSchedule))

const storageTargetsLabel = computed(() =>
  form.formData.storageTargets.map(target => form.getStorageTargetLabel(target)).join(', ')
)

const longTermRetentionLines = computed(() =>
  LONG_TERM_RETENTION_FIELDS.map(
    ({ period, retention, keep }) =>
      [period, backupRepository.formData[retention], backupRepository.formData[keep]] as const
  )
    .filter(([, retention]) => retention !== undefined && retention > 0)
    .map(([period, retention, keep]) =>
      t('long-term-retention:row', {
        count: retention,
        period: t(`long-term-retention:${period}`),
        keep: backupRepository.getKeepLabel(period, keep),
      })
    )
)
</script>

<style lang="postcss" scoped>
.backup-job-review-target {
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
