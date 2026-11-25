<template>
  <div class="backup-job-review-step">
    <BackupJobReviewSection :title="t('source')" @edit="emit('edit', 'source')">
      <BackupJobReviewSource :form="source" />
    </BackupJobReviewSection>

    <BackupJobReviewSection v-if="transfer" :title="t('transfer')" @edit="emit('edit', 'transfer')">
      <BackupJobReviewTransfer
        :form="transfer"
        :is-incremental="source.isIncremental.value"
        :is-mirror="source.isMirror.value"
      />
    </BackupJobReviewSection>

    <BackupJobReviewSection :title="t('target')" @edit="emit('edit', 'target')">
      <BackupJobReviewTarget :form="target" />
    </BackupJobReviewSection>

    <BackupJobReviewSection :title="t('planning')" @edit="emit('edit', 'planning')">
      <BackupJobReviewPlanning :form="planning" :is-metadata="source.isMetadata.value" />
    </BackupJobReviewSection>
  </div>
</template>

<script lang="ts" setup>
import BackupJobReviewPlanning from '@/modules/backup-job/components/form/review/BackupJobReviewPlanning.vue'
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import BackupJobReviewSource from '@/modules/backup-job/components/form/review/BackupJobReviewSource.vue'
import BackupJobReviewTarget from '@/modules/backup-job/components/form/review/BackupJobReviewTarget.vue'
import BackupJobReviewTransfer from '@/modules/backup-job/components/form/review/BackupJobReviewTransfer.vue'
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
