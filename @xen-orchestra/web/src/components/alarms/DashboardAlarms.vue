<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('alarms') }}
      <UiCounter
        v-if="alarms.length !== 0 && isReady"
        accent="danger"
        size="small"
        variant="primary"
        :value="alarms.length"
      />
    </UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
    <VtsStateHero v-else-if="alarms.length === 0" format="card" type="all-good" horizontal size="medium">
      <span>{{ t('all-good') }}</span>
      <span>{{ t('no-alarms-detected') }}</span>
    </VtsStateHero>
    <div v-else class="alarm-list-container">
      <UiAlarmList>
        <UiAlarmItem
          v-for="alarm in alarms"
          :key="alarm.id"
          :label="alarm.body.name"
          :percent="Number(alarm.body.value)"
          :size="uiStore.isDesktopLarge ? 'large' : 'small'"
          :date="alarm.time"
        >
          <template #link>
            <AlarmLink :type="alarm.object.type" :uuid="alarm.object.uuid" />
          </template>
        </UiAlarmItem>
      </UiAlarmList>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import AlarmLink from '@/components/alarms/AlarmLink.vue'
import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  alarms: XoAlarm[]
  isReady: boolean
  hasError?: boolean
}>()

const { t } = useI18n()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.alarm-list-container {
  overflow: auto;
  margin-inline: -2.4rem;
  margin-block-end: -1.2rem;
}
</style>
