<template>
  <UiCard>
    <UiCardTitle>
      {{ t('schedules') }}
      <UiCounter :value="backupJobSchedules.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <template v-for="(schedule, index) in backupJobSchedules" :key="schedule.id">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('name') }}
          </template>
          <template #value>
            <UiLink
              v-if="schedule.name"
              size="small"
              icon="object:backup-schedule"
              :href="`/#/backup/${schedule.jobId}/edit`"
            >
              {{ schedule.name }}
            </UiLink>
          </template>
          <template v-if="schedule.name" #addons>
            <VtsCopyButton :value="schedule.name" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('id') }}
          </template>
          <template #value>
            {{ schedule.id }}
          </template>
          <template #addons>
            <VtsCopyButton :value="schedule.id" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('status') }}
          </template>
          <template #value>
            <VtsEnabledState :enabled="schedule.enabled" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('cron-pattern') }}
          </template>
          <template #value>
            {{ schedule.cron }}
          </template>
          <template #addons>
            <VtsCopyButton :value="schedule.cron" />
          </template>
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoSchedule } from '@/types/xo/schedule.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
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

  .divider {
    margin-block: 1.6rem;
  }
}
</style>
