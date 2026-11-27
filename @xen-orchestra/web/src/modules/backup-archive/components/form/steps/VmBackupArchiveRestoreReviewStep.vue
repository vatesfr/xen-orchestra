<template>
  <div class="vm-backup-archive-restore-review-step">
    <BackupJobReviewSection :title="t('restore-type')" @edit="emit('edit')">
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('type')" :value="restoreTypeLabel" />
      </VtsTabularKeyValueList>
    </BackupJobReviewSection>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  restoreTypeLabel: string
}>()

const emit = defineEmits<{
  edit: []
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-review-step {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
