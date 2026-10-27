<template>
  <div class="schedule-cron-editor">
    <VtsInputWrapper :label="t('time-zone')">
      <VtsSelect :id="timezoneSelectId" accent="brand" />
    </VtsInputWrapper>

    <div class="cards">
      <ScheduleCronCard
        v-model="monthField"
        :title="t('month')"
        :unit="t('cron:unit:month')"
        :options="monthOptions"
        :columns="3"
        :range="CRON_FIELD_RANGES.month"
      />
      <ScheduleCronCard
        v-if="isWeekDayMode"
        v-model="weekDayField"
        :title="t('day')"
        :unit="t('cron:unit:day')"
        :options="weekDayOptions"
        :columns="7"
        :range="CRON_FIELD_RANGES.weekDay"
      >
        <template #header-actions>
          <UiToggle v-model="isWeekDayMode">{{ t('weekdays') }}</UiToggle>
        </template>
      </ScheduleCronCard>
      <ScheduleCronCard
        v-else
        v-model="monthDayField"
        :title="t('day')"
        :unit="t('cron:unit:day')"
        :options="monthDayOptions"
        :columns="7"
        :range="CRON_FIELD_RANGES.monthDay"
      >
        <template #header-actions>
          <UiToggle v-model="isWeekDayMode">{{ t('weekdays') }}</UiToggle>
        </template>
      </ScheduleCronCard>
      <ScheduleCronCard
        v-model="hourField"
        :title="t('hour')"
        :unit="t('cron:unit:hour')"
        :options="hourOptions"
        :columns="6"
        :range="CRON_FIELD_RANGES.hour"
      />
      <ScheduleCronCard
        v-model="minuteField"
        :title="t('minute')"
        :unit="t('cron:unit:minute')"
        :options="minuteOptions"
        :columns="10"
        :range="CRON_FIELD_RANGES.minute"
      />
    </div>

    <div class="summary">
      <div class="expression">
        <UiLabel accent="neutral">{{ t('resulting-expression') }}</UiLabel>
        <UiInput :model-value="cron" accent="brand" disabled />
      </div>
      <ScheduleNextRuns :cron :timezone />
    </div>
  </div>
</template>

<script lang="ts" setup>
import ScheduleCronCard, { type ScheduleCronCardOption } from '@/modules/schedule/components/ScheduleCronCard.vue'
import ScheduleNextRuns from '@/modules/schedule/components/ScheduleNextRuns.vue'
import { CRON_FIELD_RANGES, type CronFieldName, joinCron, splitCron } from '@/modules/schedule/utils/cron.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const cron = defineModel<string>({ required: true })

const timezone = defineModel<string | undefined>('timezone', { required: true })

const { t, locale } = useI18n()

const timezones = Intl.supportedValuesOf('timeZone')

const { id: timezoneSelectId } = useFormSelect(timezones, {
  model: timezone,
  searchable: true,
  required: true,
})

function useCronField(name: CronFieldName) {
  return computed({
    get: () => splitCron(cron.value)[name],
    set: value => {
      cron.value = joinCron({ ...splitCron(cron.value), [name]: value })
    },
  })
}

const minuteField = useCronField('minute')
const hourField = useCronField('hour')
const monthDayField = useCronField('monthDay')
const monthField = useCronField('month')
const weekDayField = useCronField('weekDay')

const isWeekDayMode = ref(weekDayField.value !== '*' || monthDayField.value === '*')

watch(isWeekDayMode, () => {
  cron.value = joinCron({ ...splitCron(cron.value), monthDay: '*', weekDay: '*' })
})

function padNumber(value: number): string {
  return String(value).padStart(2, '0')
}

const minuteOptions = computed<ScheduleCronCardOption[]>(() =>
  Array.from({ length: 60 }, (_, minute) => ({ label: padNumber(minute), value: minute }))
)

const hourOptions = computed<ScheduleCronCardOption[]>(() =>
  Array.from({ length: 24 }, (_, hour) => ({ label: padNumber(hour), value: hour }))
)

const monthDayOptions = computed<ScheduleCronCardOption[]>(() =>
  Array.from({ length: 31 }, (_, day) => ({ label: String(day + 1), value: day + 1 }))
)

const monthOptions = computed<ScheduleCronCardOption[]>(() => {
  const format = new Intl.DateTimeFormat(locale.value, { month: 'long', timeZone: 'UTC' })

  return Array.from({ length: 12 }, (_, month) => ({
    label: format.format(Date.UTC(2024, month, 1)),
    value: month + 1,
  }))
})

const weekDayOptions = computed<ScheduleCronCardOption[]>(() => {
  const format = new Intl.DateTimeFormat(locale.value, { weekday: 'short', timeZone: 'UTC' })

  return [1, 2, 3, 4, 5, 6, 0].map(day => ({ label: format.format(Date.UTC(2024, 0, 7 + day)), value: day }))
})
</script>

<style lang="postcss" scoped>
.schedule-cron-editor {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.6rem;

    @media (--small) {
      grid-template-columns: 1fr;
    }
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    align-items: start;
    gap: 1.6rem;

    @media (--small) {
      grid-template-columns: 1fr;
    }
  }

  .expression {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
