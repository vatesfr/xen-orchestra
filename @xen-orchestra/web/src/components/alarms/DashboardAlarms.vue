<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('alarms') }}
      <UiCounter
        v-if="rawAlarms.length !== 0 && isReady"
        accent="danger"
        size="small"
        variant="primary"
        :value="rawAlarms.length"
      />
    </UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="rawAlarms.length === 0" format="card" type="all-good" horizontal size="medium">
      <span>{{ t('all-good') }}</span>
      <span>{{ t('no-alarms-detected') }}</span>
    </VtsStateHero>
    <div v-else class="alarm-list-container" v-bind="containerProps">
      <UiAlarmList v-bind="wrapperProps">
        <UiAlarmItem
          v-for="alarm in alarms"
          :key="alarm.index"
          :label="alarm.data.body.name"
          :percent="Number(alarm.data.body.value)"
          :size="uiStore.isDesktopLarge ? 'large' : 'small'"
          :date="alarm.data.time"
        >
          <template #link>
            <AlarmLink :type="alarm.data.object.type" :uuid="alarm.data.object.uuid" />
          </template>
        </UiAlarmItem>
      </UiAlarmList>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import AlarmLink from '@/components/alarms/AlarmLink.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoAlarm } from '@vates/types'
import { useVirtualList } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { alarms: rawAlarms } = defineProps<{
  alarms: XoAlarm[]
  isReady: boolean
  hasError?: boolean
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const {
  list: alarms,
  containerProps,
  wrapperProps,
} = useVirtualList(
  computed(() => rawAlarms),
  { itemHeight: () => (uiStore.isDesktopLarge ? 42 : 71) }
)
</script>

<style lang="postcss" scoped>
.alarm-list-container {
  overflow: auto;
  margin-inline: -2.4rem;
  margin-block-end: -1.2rem;
}
</style>
