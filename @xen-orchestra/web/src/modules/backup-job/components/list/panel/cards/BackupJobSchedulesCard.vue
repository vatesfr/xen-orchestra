<template>
  <UiPanelCard class="backup-job-schedules-card">
    <UiPanelCardTitle size="medium" :label="t('schedules')" :counter="schedules.length" />
    <div class="content">
      <template v-for="(schedule, index) in schedules" :key="schedule.id">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <VtsCardRowKeyValue>
          <template #key>{{ t('name') }}</template>
          <template #value>
            <UiLink size="small" icon="object:backup-schedule" :href="overviewHref">
              {{ schedule.name || t('untitled') }}
            </UiLink>
          </template>
          <template v-if="schedule.name" #addons>
            <VtsCopyButton :value="schedule.name" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('id') }}</template>
          <template #value>{{ schedule.id }}</template>
          <template #addons>
            <VtsCopyButton :value="schedule.id" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('status') }}</template>
          <template #value>
            <VtsStatus :status="schedule.enabled" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('cron-pattern') }}</template>
          <template #value>
            <span class="cron-pattern">{{ schedule.cron }}</span>
          </template>
          <template #addons>
            <VtsCopyButton :value="schedule.cron" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('next-run') }}</template>
          <template #value>{{ nextRuns.get(schedule.id) }}</template>
          <template v-if="nextRuns.get(schedule.id)" #addons>
            <VtsCopyButton :value="nextRuns.get(schedule.id) ?? ''" />
          </template>
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoSchedule } from '@/modules/backup-job/remote-resources/use-xo-schedule-collection.ts'
import { getScheduleNextRun } from '@/modules/backup-job/utils/xo-schedule.util.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { schedules } = defineProps<{
  schedules: FrontXoSchedule[]
}>()

const { t, d } = useI18n()

const { buildXo5Route } = useXoRoutes()

const overviewHref = computed(() => buildXo5Route('/backup/overview'))

const nextRuns = computed(() => {
  const formattedNextRuns = new Map<FrontXoSchedule['id'], string>()

  schedules.forEach(schedule => {
    const nextRun = getScheduleNextRun(schedule)

    if (nextRun !== undefined) {
      formattedNextRuns.set(schedule.id, d(nextRun, { dateStyle: 'short', timeStyle: 'medium' }))
    }
  })

  return formattedNextRuns
})
</script>

<style scoped lang="postcss">
.backup-job-schedules-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    .divider {
      margin-block: 1.6rem;
    }

    .cron-pattern {
      overflow-wrap: anywhere;
    }
  }
}
</style>
