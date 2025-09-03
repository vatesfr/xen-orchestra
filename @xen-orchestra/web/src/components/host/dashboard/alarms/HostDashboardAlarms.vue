<template>
  <UiCard class="host-dashboard-alarms">
    <UiCardTitle>
      {{ t('alarms') }}
      <UiCounter
        v-if="hostAlarms.length !== 0 && areHostAlarmsReady"
        accent="danger"
        size="small"
        variant="primary"
        :value="hostAlarms.length"
      />
    </UiCardTitle>
    <VtsLoadingHero v-if="!areHostAlarmsReady" type="card" />
    <VtsAllGoodHero v-else-if="hostAlarms.length === 0" type="card" />
    <div v-else class="alarm-list-container">
      <UiAlarmList>
        <template v-for="alarm in hostAlarms" :key="alarm.id">
          <UiAlarmItem
            :label="alarm.body.name"
            :percent="Number(alarm.body.value)"
            :size="uiStore.isDesktopLarge ? 'large' : 'small'"
            :date="alarm.time"
          >
            <template #link>
              <AlarmLink :type="alarm.object.type" :uuid="alarm.object.uuid" />
            </template>
          </UiAlarmItem>
        </template>
      </UiAlarmList>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import AlarmLink from '@/components/host/dashboard/alarms/AlarmLink.vue'
import { useXoHostAlarmsCollection } from '@/remote-resources/use-xo-host-alarms-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsAllGoodHero from '@core/components/state-hero/VtsAllGoodHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { hostAlarms, areHostAlarmsReady } = useXoHostAlarmsCollection({}, () => host?.id)

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.host-dashboard-alarms {
  max-height: 24.9rem;

  .alarm-list-container {
    overflow: auto;
    margin-inline: -2.4rem;
    margin-block-end: -1.2rem;
  }
}
</style>
