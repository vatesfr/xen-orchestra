<template>
  <div class="backup-job-review-step">
    <BackupJobReviewSection :title="t('source')" @edit="emit('edit', 'source')">
      <BackupJobSourceReview :form="source" />
    </BackupJobReviewSection>

    <BackupJobReviewSection v-if="transfer" :title="t('transfer')" @edit="emit('edit', 'transfer')">
      <BackupJobTransferReview
        :form="transfer"
        :is-incremental="source.formData.mode === 'delta'"
        :is-mirror="source.formData.dataSource === 'mirror'"
      />
    </BackupJobReviewSection>

    <BackupJobReviewSection :title="t('target')" @edit="emit('edit', 'target')">
      <BackupJobTargetReview :form="target" />
    </BackupJobReviewSection>

    <BackupJobReviewSection :title="t('planning')" @edit="emit('edit', 'planning')">
      <BackupJobPlanningReview :form="planning" :is-metadata="source.formData.dataSource === 'metadata'" />
    </BackupJobReviewSection>
  </div>
</template>

<script lang="ts" setup>
import BackupJobPlanningReview from '@/modules/backup-job/components/form/review/BackupJobPlanningReview.vue'
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import BackupJobSourceReview from '@/modules/backup-job/components/form/review/BackupJobSourceReview.vue'
import BackupJobTargetReview from '@/modules/backup-job/components/form/review/BackupJobTargetReview.vue'
import BackupJobTransferReview from '@/modules/backup-job/components/form/review/BackupJobTransferReview.vue'
import type { BackupJobPlanningForm } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import type { BackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { BackupJobTransferForm } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  source: BackupJobSourceForm
  transfer: BackupJobTransferForm | undefined
  target: BackupJobTargetForm
  planning: BackupJobPlanningForm
}>()

const emit = defineEmits<{
  edit: [step: 'source' | 'transfer' | 'target' | 'planning']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-review-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;
}
</style>
