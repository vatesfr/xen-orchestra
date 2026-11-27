<template>
  <div class="vm-backup-archive-restore-disk-storage-cell">
    <template v-if="isStorageAction">
      <VtsSelect :id="srSelectId" accent="neutral">
        <template #default="{ option }">
          <VtsDetailedOption :option :details="getOptionDetails(option.source)" />
        </template>
      </VtsSelect>
      <UiInfo v-if="row.srError !== undefined" accent="danger" wrap>{{ row.srError }}</UiInfo>
    </template>
    <span v-else-if="row.action === 'read-only'" class="static typo-body-regular-small">
      <VtsIcon name="object:backup-archive" size="medium" />
      {{ readOnlyLabel }}
    </span>
    <span v-else class="static typo-body-regular-small">{{ t('not-restored') }}</span>
  </div>
</template>

<script lang="ts" setup>
import type { VmBackupArchiveRestoreDiskRow } from '@/modules/backup-archive/types/vm-backup-archive-restore-disk-row.type.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { row, srs, defaultSrLabel, getSrDetails } = defineProps<{
  row: VmBackupArchiveRestoreDiskRow
  srs: FrontXoSr[]
  defaultSrLabel: string
  readOnlyLabel: string
  getSrDetails: (sr: FrontXoSr) => string
}>()

const emit = defineEmits<{
  selectSr: [srId: FrontXoSr['id'] | undefined]
}>()

const { t } = useI18n()

const isStorageAction = computed(() => row.action === 'copy' || row.action === 'read-write')

const srId = computed({
  get: () => row.srId,
  set: value => emit('selectSr', value),
})

const { id: srSelectId } = useFormSelect(() => srs, {
  model: srId,
  searchable: true,
  emptyOption: () => ({ label: defaultSrLabel, value: undefined }),
  option: {
    label: 'name_label',
    value: 'id',
  },
})

function getOptionDetails(source: FrontXoSr | symbol) {
  return typeof source === 'symbol' ? undefined : getSrDetails(source)
}
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-disk-storage-cell {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;

  .static {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
