<template>
  <div class="backup-job-target-health-check-section">
    <UiTitle>{{ t('health-check') }}</UiTitle>

    <BackupJobFormCheckbox v-bind="bindings.healthCheckEnabled" />

    <template v-if="bindings.healthCheckEnabled.modelValue">
      <BackupJobFormRow>
        <BackupJobFormSelect v-bind="bindings.healthCheckSr" />
        <BackupJobFormNumberInput v-bind="bindings.healthCheckTimeout" />
      </BackupJobFormRow>

      <BackupJobFormRow>
        <BackupJobFormSelect v-bind="bindings.healthCheckVmTags" />
      </BackupJobFormRow>

      <div class="block">
        <BackupJobFormRadio v-bind="bindings.healthCheckSchedule" />

        <div v-if="bindings.healthCheckSchedule.modelValue === 'dynamic'" class="cards">
          <BackupJobFormValueCard v-bind="bindings.healthCheckMonthDays" :columns="7" />
          <div class="side">
            <BackupJobFormValueCard v-bind="bindings.healthCheckWeekDays" :columns="7" />
            <BackupJobFormStepCard
              :model-value="bindings.healthCheckMonthDays.modelValue"
              :options="bindings.healthCheckMonthDays.options"
              :unit="t('cron:unit:day')"
              @update:model-value="bindings.healthCheckMonthDays['onUpdate:modelValue']($event)"
            />
          </div>
          <BackupJobFormValueCard v-bind="bindings.healthCheckHours" :columns="6" />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobFormStepCard from '@/modules/backup-job/components/form/inputs/BackupJobFormStepCard.vue'
import BackupJobFormValueCard from '@/modules/backup-job/components/form/inputs/BackupJobFormValueCard.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobTargetForm['bindings']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-target-health-check-section {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .block {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.6rem;

    @media (--small) {
      grid-template-columns: 1fr;
    }
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    & > :last-child {
      flex: 1;
    }
  }
}
</style>
