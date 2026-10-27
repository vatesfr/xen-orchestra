<template>
  <div class="backup-job-planning-step">
    <UiAlert accent="info">{{ t('daylight-saving-time-warning') }}</UiAlert>
    <ScheduleCronEditor
      v-bind="bindings.cron"
      :timezone="bindings.timezone.modelValue"
      @update:timezone="bindings.timezone['onUpdate:modelValue']($event)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { BackupJobPlanningForm } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import ScheduleCronEditor from '@/modules/schedule/components/ScheduleCronEditor.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobPlanningForm['bindings']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-planning-step {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  margin-block-start: 2.4rem;
  text-align: left;
}
</style>
