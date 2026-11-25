<template>
  <div class="backup-job-review-source">
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="form.formData.name" />
      <VtsTabularKeyValueRow :label="t('enabled')">
        <template #value>
          <VtsStatus :status="form.formData.enabled" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('data-source')" :value="dataSourceLabel" />
      <VtsTabularKeyValueRow v-if="!form.isMetadata.value" :label="t('backup-mode')" :value="modeLabel" />
      <template v-if="form.isMirror.value">
        <VtsTabularKeyValueRow :label="t('source-proxy')" :value="sourceProxy?.name" />
        <VtsTabularKeyValueRow :label="t('source-backup-repository')" :value="sourceBackupRepository?.name" />
      </template>
      <template v-if="form.isMetadata.value">
        <VtsTabularKeyValueRow :label="t('save-xo-config')">
          <template #value>
            <VtsStatus :status="form.formData.saveXoConfig" />
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('save-pools-metadata')">
          <template #value>
            <VtsStatus :status="form.formData.savePoolsMetadata" />
          </template>
        </VtsTabularKeyValueRow>
      </template>
      <VtsTabularKeyValueRow
        v-if="!form.isMetadata.value || form.formData.savePoolsMetadata"
        :label="t('scope-type')"
        :value="scopeTypeLabel"
      />
      <VtsTabularKeyValueRow v-if="isManualVmSelection" :label="t('scope-preview')">
        <template #value>
          <BackupJobReviewScopePreview
            :items="selectedVmItems"
            :count-label="t('n-vms', { n: selectedVmItems.length })"
          />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-if="isManualPoolSelection" :label="t('scope-preview')">
        <template #value>
          <BackupJobReviewScopePreview
            :items="selectedPoolItems"
            :count-label="t('n-pools', { n: selectedPoolItems.length })"
          />
        </template>
      </VtsTabularKeyValueRow>
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
import BackupJobReviewScopePreview from '@/modules/backup-job/components/form/review/BackupJobReviewScopePreview.vue'
import type { BackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import VtsQueryBuilderPreview from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobSourceForm
}>()

const { t } = useI18n()

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
