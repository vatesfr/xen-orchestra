<template>
  <VtsTabularKeyValueList>
    <VtsTabularKeyValueRow
      :label="t('data-source')"
      :value="getOptionLabel(bindings.dataSource.options, bindings.dataSource.modelValue)"
    />
    <VtsTabularKeyValueRow
      v-if="bindings.dataSource.modelValue !== 'metadata'"
      :label="t('backup-mode')"
      :value="getOptionLabel(bindings.mode.options, bindings.mode.modelValue)"
    />
    <template v-if="bindings.dataSource.modelValue === 'mirror'">
      <VtsTabularKeyValueRow :label="t('source-proxy')" :value="sourceProxy?.name" />
      <VtsTabularKeyValueRow :label="t('source-backup-repository')" :value="sourceBackupRepository?.name" />
    </template>
    <template v-if="bindings.dataSource.modelValue === 'metadata'">
      <VtsTabularKeyValueRow :label="t('save-xo-config')">
        <template #value>
          <VtsStatus :status="bindings.saveXoConfig.modelValue" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('save-pools-metadata')">
        <template #value>
          <VtsStatus :status="bindings.savePoolsMetadata.modelValue" />
        </template>
      </VtsTabularKeyValueRow>
    </template>
    <VtsTabularKeyValueRow
      v-if="bindings.dataSource.modelValue !== 'metadata' || bindings.savePoolsMetadata.modelValue"
      :label="t('scope-type')"
      :value="getOptionLabel(bindings.scopeType.options, bindings.scopeType.modelValue)"
    />
    <VtsTabularKeyValueRow v-if="isManualVmSelection" :label="t('scope-preview')">
      <template #value>
        <div class="scope-preview">
          <span class="count typo-body-regular-small">{{ t('n-vms', { n: selectedVmItems.length }) }}</span>
          <UiCollapsibleList tag="div" :total-items="selectedVmItems.length">
            <UiObjectLink v-for="item of selectedVmItems" :key="item.id" :route="item.route" :icon="item.icon">
              {{ item.label }}
            </UiObjectLink>
          </UiCollapsibleList>
        </div>
      </template>
    </VtsTabularKeyValueRow>
  </VtsTabularKeyValueList>
  <VtsQueryBuilderPreview
    v-if="isDynamicVmSelection"
    :filter="form.formData.vmFilter"
    :schema="vmSelectionSchema"
    :items="matchedSelectionItems"
    :count-label="t('n-vms', { n: matchedSelectionItems.length })"
  />
</template>

<script lang="ts" setup>
import type { BackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import { getOptionLabel } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import VtsQueryBuilderPreview from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobSourceForm
}>()

const { t } = useI18n()

const bindings = computed(() => form.bindings)

const { useGetProxyById } = useXoProxyCollection()

const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

const sourceProxy = useGetProxyById(() => form.formData.proxy)

const sourceBackupRepository = useGetBackupRepositoryById(() => form.formData.sourceBackupRepository)

const isManualVmSelection = computed(() => form.hasVmSelection.value && form.formData.scopeType === 'manual')

const isDynamicVmSelection = computed(
  () => form.hasVmSelection.value && form.formData.scopeType === 'smart' && form.formData.vmFilter !== ''
)

const { vmSelectionSchema, matchedSelectionItems, selectedSelectionItems: selectedVmItems } = form
</script>

<style lang="postcss" scoped>
.scope-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .count {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
