<template>
  <div class="backup-job-target-health-check-section">
    <UiTitle>{{ t('health-check') }}</UiTitle>

    <BackupJobFormCheckbox v-bind="bindings.healthCheckEnabled" />

    <template v-if="bindings.healthCheckEnabled.modelValue">
      <BackupJobFormRow>
        <BackupJobFormSelect v-bind="bindings.healthCheckSr">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="option-content">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </BackupJobFormSelect>
        <BackupJobFormNumberInput v-bind="bindings.healthCheckTimeout" />
      </BackupJobFormRow>

      <BackupJobFormRow>
        <BackupJobFormSelect v-bind="bindings.healthCheckVmTags" />
      </BackupJobFormRow>

      <div class="block">
        <BackupJobFormRadio v-bind="bindings.healthCheckSchedule" />

        <template v-if="bindings.healthCheckSchedule.modelValue === 'dynamic'">
          <UiInfo accent="warning" wrap>{{ t('health-check-dynamic-info') }}</UiInfo>

          <BackupJobFormCalendarCards
            :month-days="bindings.healthCheckMonthDays"
            :week-days="bindings.healthCheckWeekDays"
            :hours="bindings.healthCheckHours"
          />
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCalendarCards from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarCards.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import type { BackupJobTargetHealthCheckForm } from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobTargetHealthCheckForm['bindings']
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

  .option-content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
