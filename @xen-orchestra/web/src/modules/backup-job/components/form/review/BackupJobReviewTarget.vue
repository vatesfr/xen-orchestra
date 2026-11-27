<template>
  <div class="backup-job-review-target">
    <VtsTabularKeyValueList v-if="form.hasStorageTargetChoice.value">
      <BackupJobReviewRow
        :label="t('storage-target')"
        :value="storageTargetsLabel"
        :overridden="isTargetOverridden('storageTargets')"
      />
    </VtsTabularKeyValueList>

    <template v-if="form.hasBackupRepositorySection.value">
      <UiSubtitle>{{ t('backup-repositories') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <BackupJobReviewRow
          v-if="form.hasTargetProxy.value"
          :label="t('target-proxy')"
          :value="targetProxy?.name"
          :overridden="isBackupRepositoryOverridden('targetProxy')"
        />
        <BackupJobReviewRow
          :label="t('scope-type')"
          :value="backupRepositoryScopeTypeLabel"
          :overridden="isBackupRepositoryOverridden('backupRepositoryScopeType')"
        />
        <BackupJobReviewRow
          v-if="backupRepository.formData.backupRepositoryScopeType === 'manual'"
          :label="t('scope-preview')"
        >
          <BackupJobReviewScopePreview
            :items="selectedBackupRepositoryItems"
            :count-label="t('n-brs', { n: selectedBackupRepositoryItems.length })"
            :added-ids="backupRepositoryChanges?.addedIds"
            :deleted-label="
              backupRepositoryChanges?.deletedCount
                ? t('n-brs-deleted', backupRepositoryChanges.deletedCount)
                : undefined
            "
          />
        </BackupJobReviewRow>
      </VtsTabularKeyValueList>
      <VtsQueryBuilderPreview
        v-if="backupRepository.formData.backupRepositoryScopeType === 'smart'"
        :filter="backupRepository.formData.backupRepositoryFilter"
        :schema="backupRepository.backupRepositorySchema"
        :items="matchedBackupRepositoryItems"
        :count-label="t('n-brs', { n: matchedBackupRepositoryItems.length })"
      />
      <VtsTabularKeyValueList>
        <BackupJobReviewRow
          v-if="form.hasRetentionStrategy.value"
          :label="t('backup-distribution-strategy')"
          :value="backupDistributionLabel"
          :overridden="isBackupRepositoryOverridden('backupDistribution')"
        />
        <BackupJobReviewRow
          :label="t('minimum-backups-to-retain')"
          :value="backupRepository.formData.exportRetention?.toString()"
          :overridden="isBackupRepositoryOverridden('exportRetention')"
        />
        <template v-if="form.hasRetentionStrategy.value">
          <BackupJobReviewRow
            :label="t('long-term-retention')"
            :overridden="isBackupRepositoryOverridden(...LONG_TERM_RETENTION_KEYS)"
          >
            <div class="lines">
              <span v-for="line of longTermRetentionLines" :key="line">{{ line }}</span>
            </div>
          </BackupJobReviewRow>
          <BackupJobReviewRow
            v-if="form.hasStrictGfs.value"
            :label="t('enforce-strict-gfs-hierarchy')"
            :overridden="isBackupRepositoryOverridden('strictGfs')"
          >
            <VtsStatus :status="backupRepository.formData.strictGfs" />
          </BackupJobReviewRow>
          <BackupJobReviewRow
            :label="t('merge-backups-synchronously')"
            :overridden="isBackupRepositoryOverridden('mergeBackupsSynchronously')"
          >
            <VtsStatus :status="backupRepository.formData.mergeBackupsSynchronously" />
          </BackupJobReviewRow>
        </template>
      </VtsTabularKeyValueList>
    </template>

    <template v-if="form.hasStorageRepositorySection.value">
      <UiSubtitle>{{ t('storage-repositories') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <BackupJobReviewRow
          :label="t('scope-type')"
          :value="storageRepositoryScopeTypeLabel"
          :overridden="isStorageRepositoryOverridden('storageRepositoryScopeType')"
        />
        <BackupJobReviewRow
          v-if="storageRepository.formData.storageRepositoryScopeType === 'manual'"
          :label="t('scope-preview')"
        >
          <BackupJobReviewScopePreview
            :items="selectedStorageRepositoryItems"
            :count-label="t('n-srs', { n: selectedStorageRepositoryItems.length })"
            :added-ids="storageRepositoryChanges?.addedIds"
            :deleted-label="
              storageRepositoryChanges?.deletedCount
                ? t('n-srs-deleted', storageRepositoryChanges.deletedCount)
                : undefined
            "
          />
        </BackupJobReviewRow>
      </VtsTabularKeyValueList>
      <VtsQueryBuilderPreview
        v-if="storageRepository.formData.storageRepositoryScopeType === 'smart'"
        :filter="storageRepository.formData.storageRepositoryFilter"
        :schema="storageRepository.storageRepositorySchema"
        :items="matchedStorageRepositoryItems"
        :count-label="t('n-srs', { n: matchedStorageRepositoryItems.length })"
      />
      <VtsTabularKeyValueList>
        <BackupJobReviewRow
          :label="t('replica-distribution-strategy')"
          :value="replicaDistributionLabel"
          :overridden="isStorageRepositoryOverridden('replicaDistribution')"
        />
        <BackupJobReviewRow
          :label="t('minimum-replicas-to-retain')"
          :value="storageRepository.formData.copyRetention?.toString()"
          :overridden="isStorageRepositoryOverridden('copyRetention')"
        />
      </VtsTabularKeyValueList>
    </template>

    <template v-if="form.hasHealthCheckSection.value">
      <UiSubtitle>{{ t('health-check') }}</UiSubtitle>
      <VtsTabularKeyValueList>
        <BackupJobReviewRow
          :label="t('enable-health-check')"
          :overridden="isHealthCheckOverridden('healthCheckEnabled')"
        >
          <VtsStatus :status="healthCheck.formData.healthCheckEnabled" />
        </BackupJobReviewRow>
        <template v-if="healthCheck.formData.healthCheckEnabled">
          <BackupJobReviewRow
            :label="t('health-check-sr')"
            :value="healthCheckSrName"
            :overridden="isHealthCheckOverridden('healthCheckSr')"
          />
          <BackupJobReviewRow
            :label="t('timeout')"
            :value="healthCheckTimeout"
            :overridden="isHealthCheckOverridden('healthCheckTimeout')"
          />
          <BackupJobReviewRow
            :label="t('health-check-vm-tags')"
            :value="healthCheckVmTagsLabel"
            :overridden="isHealthCheckOverridden('healthCheckVmTags')"
          />
          <BackupJobReviewRow
            :label="t('health-check-frequency')"
            :value="healthCheckScheduleLabel"
            :overridden="isHealthCheckOverridden('healthCheckSchedule')"
          />
          <BackupJobReviewCalendarRows
            v-if="healthCheck.formData.healthCheckSchedule === 'dynamic'"
            :month-days="healthCheck.bindings.healthCheckMonthDays"
            :week-days="healthCheck.bindings.healthCheckWeekDays"
            :hours="healthCheck.bindings.healthCheckHours"
            :month-days-overridden="isHealthCheckOverridden('healthCheckMonthDays')"
            :week-days-overridden="isHealthCheckOverridden('healthCheckWeekDays')"
            :hours-overridden="isHealthCheckOverridden('healthCheckHours')"
          />
        </template>
      </VtsTabularKeyValueList>
    </template>
  </div>
</template>

<script lang="ts" setup>
import BackupJobReviewCalendarRows from '@/modules/backup-job/components/form/review/BackupJobReviewCalendarRows.vue'
import BackupJobReviewRow from '@/modules/backup-job/components/form/review/BackupJobReviewRow.vue'
import BackupJobReviewScopePreview from '@/modules/backup-job/components/form/review/BackupJobReviewScopePreview.vue'
import { useBackupJobReviewChanges } from '@/modules/backup-job/composables/use-backup-job-review-changes.composable.ts'
import type { BackupJobTargetForm, BackupJobTargetFormData } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import { LONG_TERM_RETENTION_FIELDS } from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsQueryBuilderPreview from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form, saved } = defineProps<{
  form: BackupJobTargetForm
  saved?: BackupJobTargetFormData
}>()

const { t } = useI18n()

const { backupRepository, storageRepository, healthCheck } = form

const LONG_TERM_RETENTION_KEYS = LONG_TERM_RETENTION_FIELDS.flatMap(({ retention, keep }) => [retention, keep])

const { isOverridden: isTargetOverridden } = useBackupJobReviewChanges(
  () => form.formData,
  () => saved
)

const { isOverridden: isBackupRepositoryOverridden, getSelectionChanges: getBackupRepositorySelectionChanges } =
  useBackupJobReviewChanges(
    () => backupRepository.formData,
    () => saved?.backupRepository
  )

const { isOverridden: isStorageRepositoryOverridden, getSelectionChanges: getStorageRepositorySelectionChanges } =
  useBackupJobReviewChanges(
    () => storageRepository.formData,
    () => saved?.storageRepository
  )

const { isOverridden: isHealthCheckOverridden } = useBackupJobReviewChanges(
  () => healthCheck.formData,
  () => saved?.healthCheck
)

const backupRepositoryChanges = computed(() =>
  getBackupRepositorySelectionChanges('backupRepositoryScopeType', 'backupRepositoryIds')
)

const storageRepositoryChanges = computed(() =>
  getStorageRepositorySelectionChanges('storageRepositoryScopeType', 'storageRepositoryIds')
)

const { matchedBackupRepositoryItems, selectedBackupRepositoryItems } = backupRepository

const { matchedStorageRepositoryItems, selectedStorageRepositoryItems } = storageRepository

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
