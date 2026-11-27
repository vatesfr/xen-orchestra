<template>
  <div class="backup-job-review-source">
    <VtsTabularKeyValueList>
      <BackupJobReviewRow :label="t('name')" :value="form.formData.name" :overridden="isOverridden('name')" />
      <BackupJobReviewRow :label="t('enabled')" :overridden="isOverridden('enabled')">
        <VtsStatus :status="form.formData.enabled" />
      </BackupJobReviewRow>
      <BackupJobReviewRow
        :label="t('data-source')"
        :value="dataSourceLabel"
        :overridden="isOverridden('dataSource')"
      />
      <BackupJobReviewRow
        v-if="!form.isMetadata.value"
        :label="t('backup-mode')"
        :value="modeLabel"
        :overridden="isOverridden('mode')"
      />
      <template v-if="form.isMirror.value">
        <BackupJobReviewRow :label="t('source-proxy')" :value="sourceProxy?.name" :overridden="isOverridden('proxy')" />
        <BackupJobReviewRow
          :label="t('source-backup-repository')"
          :value="sourceBackupRepository?.name"
          :overridden="isOverridden('sourceBackupRepository')"
        />
      </template>
      <template v-if="form.isMetadata.value">
        <BackupJobReviewRow :label="t('save-xo-config')" :overridden="isOverridden('saveXoConfig')">
          <VtsStatus :status="form.formData.saveXoConfig" />
        </BackupJobReviewRow>
        <BackupJobReviewRow :label="t('save-pools-metadata')" :overridden="isOverridden('savePoolsMetadata')">
          <VtsStatus :status="form.formData.savePoolsMetadata" />
        </BackupJobReviewRow>
      </template>
      <BackupJobReviewRow
        v-if="!form.isMetadata.value || form.formData.savePoolsMetadata"
        :label="t('scope-type')"
        :value="scopeTypeLabel"
        :overridden="isOverridden('scopeType')"
      />
      <BackupJobReviewRow v-if="isManualVmSelection" :label="t('scope-preview')">
        <BackupJobReviewScopePreview
          :items="selectedVmItems"
          :count-label="t('n-vms', { n: selectedVmItems.length })"
          :added-ids="vmChanges?.addedIds"
          :deleted-label="vmChanges?.deletedCount ? t('n-vms-deleted', vmChanges.deletedCount) : undefined"
        />
      </BackupJobReviewRow>
      <BackupJobReviewRow v-if="isManualPoolSelection" :label="t('scope-preview')">
        <BackupJobReviewScopePreview
          :items="selectedPoolItems"
          :count-label="t('n-pools', { n: selectedPoolItems.length })"
          :added-ids="poolChanges?.addedIds"
          :deleted-label="poolChanges?.deletedCount ? t('n-pools-deleted', poolChanges.deletedCount) : undefined"
        />
      </BackupJobReviewRow>
    </VtsTabularKeyValueList>
    <VtsQueryBuilderPreview
      v-if="isDynamicPoolSelection"
      :filter="form.formData.poolFilter"
      :schema="poolSchema"
      :items="matchedPoolItems"
      :count-label="t('n-pools', { n: matchedPoolItems.length })"
    />
    <VtsQueryBuilderPreview
      v-if="isDynamicVmSelection"
      :filter="form.formData.vmFilter"
      :schema="vmSelectionSchema"
      :items="matchedSelectionItems"
      :count-label="t('n-vms', { n: matchedSelectionItems.length })"
    />
  </div>
</template>

<script lang="ts" setup>
import BackupJobReviewRow from '@/modules/backup-job/components/form/review/BackupJobReviewRow.vue'
import BackupJobReviewScopePreview from '@/modules/backup-job/components/form/review/BackupJobReviewScopePreview.vue'
import { useBackupJobReviewChanges } from '@/modules/backup-job/composables/use-backup-job-review-changes.composable.ts'
import type {
  BackupJobSourceForm,
  BackupJobSourceFormData,
} from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import VtsQueryBuilderPreview from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form, saved } = defineProps<{
  form: BackupJobSourceForm
  saved?: BackupJobSourceFormData
}>()

const { t } = useI18n()

const { isOverridden, getSelectionChanges } = useBackupJobReviewChanges(
  () => form.formData,
  () => saved
)

const { useGetProxyById } = useXoProxyCollection()

const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

const dataSourceLabel = computed(() => form.getDataSourceLabel(form.formData.dataSource))

const modeLabel = computed(() => form.getModeLabel(form.formData.mode))

const scopeTypeLabel = computed(() => form.getScopeTypeLabel(form.formData.scopeType))

const sourceProxy = useGetProxyById(() => form.formData.proxy)

const sourceBackupRepository = useGetBackupRepositoryById(() => form.formData.sourceBackupRepository)

const isManualVmSelection = computed(() => form.hasVmSelection.value && form.formData.scopeType === 'manual')

const isDynamicVmSelection = computed(() => form.hasVmSelection.value && form.formData.scopeType === 'smart')

const isManualPoolSelection = computed(() => form.hasPoolSelection.value && form.formData.scopeType === 'manual')

const vmChanges = computed(() => getSelectionChanges('scopeType', 'vmIds'))

const poolChanges = computed(() => getSelectionChanges('scopeType', 'poolIds'))

const isDynamicPoolSelection = computed(() => form.hasPoolSelection.value && form.formData.scopeType === 'smart')

const {
  vmSelectionSchema,
  matchedSelectionItems,
  selectedSelectionItems: selectedVmItems,
  poolSchema,
  matchedPoolItems,
  selectedPoolItems,
} = form
</script>

<style lang="postcss" scoped>
.backup-job-review-source {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
