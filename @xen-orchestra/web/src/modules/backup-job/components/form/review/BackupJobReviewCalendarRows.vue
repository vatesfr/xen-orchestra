<template>
  <VtsTabularKeyValueRow :label="t('days-of-the-month')" :value="monthDaysLabel" />
  <VtsTabularKeyValueRow :label="t('days-of-the-week')" :value="weekDaysLabel" />
  <VtsTabularKeyValueRow :label="t('hours')" :value="hoursLabel" />
</template>

<script lang="ts" setup>
import type { BackupJobFormCalendarBinding } from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarCards.vue'
import { formatSelectedLabels } from '@/modules/backup-job/utils/backup-job-selected-labels.util.ts'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { monthDays, weekDays, hours } = defineProps<{
  monthDays: BackupJobFormCalendarBinding
  weekDays: BackupJobFormCalendarBinding
  hours: BackupJobFormCalendarBinding
}>()

const { t } = useI18n()

const monthDaysLabel = computed(() => formatSelectedLabels(monthDays.options, monthDays.modelValue))

const weekDaysLabel = computed(() => formatSelectedLabels(weekDays.options, weekDays.modelValue))

const hoursLabel = computed(() => formatSelectedLabels(hours.options, hours.modelValue))
</script>
