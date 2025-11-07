<template>
  <UiCard>
    <UiCardTitle>
      {{ t('schedules') }}
      <UiCounter :value="backupJobSchedules.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <template v-for="(schedule, index) in backupJobSchedules" :key="schedule.id">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <UiLabelValue :label="t('name')" :copy-value="schedule.name" ellipsis>
          <template #value>
            <UiLink
              v-if="schedule.name"
              size="small"
              icon="object:backup-schedule"
              :href="`/#/backup/${schedule.jobId}/edit`"
              class="link"
            >
              <div v-tooltip class="text-ellipsis">
                {{ schedule.name }}
              </div>
            </UiLink>
          </template>
        </UiLabelValue>
        <UiLabelValue :label="t('id')" :value="schedule.id" :copy-value="schedule.id" ellipsis />
        <UiLabelValue :label="t('status')" ellipsis>
          <template #value>
            <VtsStatus :status="schedule.enabled" />
          </template>
        </UiLabelValue>
        <UiLabelValue :label="t('cron-pattern')" :value="schedule.cron" :copy-value="schedule.cron" ellipsis />
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoSchedule } from '@/types/xo/schedule.type.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

const { backupJobSchedules } = defineProps<{
  backupJobSchedules: XoSchedule[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .link {
    width: 100%;
  }

  .divider {
    margin-block: 1.6rem;
  }
}
</style>
