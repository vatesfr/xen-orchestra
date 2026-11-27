<template>
  <BackupJobReviewRow :label="t('days-of-the-month')" :value="monthDaysLabel" :overridden="monthDaysOverridden" />
  <BackupJobReviewRow :label="t('days-of-the-week')" :value="weekDaysLabel" :overridden="weekDaysOverridden" />
  <BackupJobReviewRow :label="t('hours')" :value="hoursLabel" :overridden="hoursOverridden" />
</template>

<script lang="ts" setup>
import type { BackupJobFormCalendarBinding } from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarCards.vue'
import BackupJobReviewRow from '@/modules/backup-job/components/form/review/BackupJobReviewRow.vue'
import { formatSelectedLabels } from '@/modules/backup-job/utils/backup-job-selected-labels.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { monthDays, weekDays, hours } = defineProps<{
  monthDays: BackupJobFormCalendarBinding
  weekDays: BackupJobFormCalendarBinding
  hours: BackupJobFormCalendarBinding
  monthDaysOverridden?: boolean
  weekDaysOverridden?: boolean
  hoursOverridden?: boolean
}>()

const { t } = useI18n()

const monthDaysLabel = computed(() => formatSelectedLabels(monthDays.options, monthDays.modelValue))

const weekDaysLabel = computed(() => formatSelectedLabels(weekDays.options, weekDays.modelValue))

const hoursLabel = computed(() => formatSelectedLabels(hours.options, hours.modelValue))
</script>
