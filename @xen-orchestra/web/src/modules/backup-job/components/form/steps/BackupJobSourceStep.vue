<template>
  <div class="backup-job-source-step">
    <BackupJobFormRadio v-bind="bindings.dataSource" />
    <BackupJobFormRadio v-if="!isMetadata" v-bind="bindings.mode" />
    <div v-if="isMetadata" class="options">
      <UiLabel accent="neutral">{{ t('options') }}</UiLabel>
      <BackupJobFormCheckbox v-bind="bindings.saveXoConfig" />
      <BackupJobFormCheckbox v-bind="bindings.savePoolsMetadata" />
    </div>
    <template v-if="bindings.dataSource.modelValue === 'mirror'">
      <BackupJobFormSelect v-bind="bindings.proxy" />
      <BackupJobFormSelect v-bind="bindings.sourceBackupRepository" />
    </template>
    <div v-if="!isMetadata || bindings.savePoolsMetadata.modelValue" class="scope">
      <BackupJobFormRadio v-bind="bindings.scopeType">
        <template v-if="!isMetadata" #info>
          <UiInfo wrap accent="info">{{ t('replications-excluded-from-selection') }}</UiInfo>
        </template>
      </BackupJobFormRadio>
      <template v-if="hasVmSelection">
        <BackupJobSourceVmTable
          v-if="bindings.scopeType.modelValue === 'manual'"
          v-model:selected-ids="selectedVmIds"
          :vms
          :error="bindings.vmIds.error"
        />
        <template v-else-if="bindings.scopeType.modelValue === 'smart'">
          <VtsQueryBuilder :model-value="vmFilter" :schema="vmSchema" @search="vmFilter = $event" />
          <UiInfo v-for="message of vmFilterErrors" :key="message" accent="danger" wrap>{{ message }}</UiInfo>
          <VtsQueryBuilderPreview
            v-if="vmFilter !== ''"
            :filter="vmFilter"
            :schema="vmSchema"
            :items="matchedVmItems"
            :count-label="t('n-vms', { n: matchedVmItems.length })"
          />
        </template>
      </template>
      <BackupJobPendingMockup v-else-if="bindings.scopeType.modelValue !== 'all'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobPendingMockup from '@/modules/backup-job/components/form/BackupJobPendingMockup.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobSourceVmTable from '@/modules/backup-job/components/form/source/BackupJobSourceVmTable.vue'
import type { BackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import { useVmQueryPreviewItems } from '@/modules/vm/composables/use-vm-query-preview-items.composable.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsQueryBuilderPreview from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobSourceForm
}>()

const { t } = useI18n()

const { bindings, vms, vmSchema, matchedVms, hasVmSelection } = form

const matchedVmItems = useVmQueryPreviewItems(matchedVms)

const selectedVmIds = computed({
  get: () => bindings.vmIds.modelValue,
  set: ids => bindings.vmIds['onUpdate:modelValue'](ids),
})

const vmFilter = computed({
  get: () => bindings.vmFilter.modelValue,
  set: value => bindings.vmFilter['onUpdate:modelValue'](value),
})

const vmFilterErrors = computed(() =>
  toArray(bindings.vmFilter.error).map(message => (typeof message === 'object' ? message.content : message))
)

const isMetadata = computed(() => bindings.dataSource.modelValue === 'metadata')
</script>

<style lang="postcss" scoped>
.backup-job-source-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .scope {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
