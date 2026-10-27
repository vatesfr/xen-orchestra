<template>
  <VtsTabularKeyValueList>
    <VtsTabularKeyValueRow :label="t('resulting-expression')" :value="form.formData.cron" />
    <VtsTabularKeyValueRow :label="t('time-zone')" :value="form.formData.timezone" />
    <VtsTabularKeyValueRow :label="t('next-runs')">
      <template #value>
        <div class="lines">
          <span v-for="run of nextRuns" :key="run">{{ run }}</span>
        </div>
      </template>
    </VtsTabularKeyValueRow>
  </VtsTabularKeyValueList>
</template>

<script lang="ts" setup>
import type { BackupJobPlanningForm } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import { getNextRunDates } from '@/modules/schedule/utils/cron.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobPlanningForm
}>()

const { t, locale } = useI18n()

const nextRuns = computed(() => {
  const format = new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: form.formData.timezone,
  })

  return getNextRunDates(form.formData.cron, form.formData.timezone, 5).map(date => format.format(date))
})
</script>

<style lang="postcss" scoped>
.lines {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
