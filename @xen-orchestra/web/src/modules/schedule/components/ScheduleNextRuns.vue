<template>
  <div class="schedule-next-runs">
    <UiLabel accent="neutral">{{ t('next-runs') }}</UiLabel>
    <ul class="runs">
      <li v-for="run of runs" :key="run.date.getTime()" class="run typo-body-regular-small">
        <span>{{ run.label }}</span>
        <span class="relative">{{ run.relative }}</span>
      </li>
      <li v-if="runs.length === 0" class="run typo-body-regular-small">{{ t('no-data') }}</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { getNextRunDates } from '@/modules/schedule/utils/cron.util.ts'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { formatTimeAgoIntl, useNow } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  cron,
  timezone,
  count = 5,
} = defineProps<{
  cron: string
  timezone: string | undefined
  count?: number
}>()

const { t, locale } = useI18n()

const now = useNow({ interval: 60_000 })

const nextDates = computed(() => getNextRunDates(cron, timezone, count))

const runs = computed(() => {
  const format = new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  })

  return nextDates.value.map(date => ({
    date,
    label: format.format(date),
    relative: formatTimeAgoIntl(
      date,
      { locale: locale.value, relativeTimeFormatOptions: { style: 'narrow' }, insertSpace: false },
      now.value
    ),
  }))
})
</script>

<style lang="postcss" scoped>
.schedule-next-runs {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .runs {
    display: flex;
    flex-direction: column;
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.8rem;
    background-color: var(--color-neutral-background-primary);
  }

  .run {
    display: flex;
    justify-content: space-between;
    gap: 1.6rem;
    padding: 1.2rem 1.6rem;

    &:not(:last-child) {
      border-block-end: 0.1rem solid var(--color-neutral-border);
    }
  }

  .relative {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
