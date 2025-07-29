<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>
      {{ t('alarms') }}
      <UiCounter
        v-if="alarms.length !== 0 && areAlarmsReady"
        accent="danger"
        size="small"
        variant="primary"
        :value="alarms.length"
      />
    </UiCardTitle>
    <VtsLoadingHero v-if="!areAlarmsReady" type="card" />
    <VtsAllGoodHero v-else-if="alarms.length === 0" type="card" />
    <div v-else class="alarm-items">
      <UiAlarmList>
        <template v-for="alarm in alarms" :key="alarm.id">
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
import AlarmLink from '@/components/pool/dashboard/alarms/AlarmLink.vue'
import { useAlarmStore } from '@/stores/xo-rest-api/alarm.store.ts'
import { useHostStore } from '@/stores/xo-rest-api/host.store.ts'
import { useSrStore } from '@/stores/xo-rest-api/sr.store.ts'
import { useVmControllerStore } from '@/stores/xo-rest-api/vm-controller.store.ts'
import { useVmStore } from '@/stores/xo-rest-api/vm.store.ts'
import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsAllGoodHero from '@core/components/state-hero/VtsAllGoodHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
}>()

const { t } = useI18n()

const { get } = useAlarmStore().subscribe()
const { isReady: areHostsReady } = useHostStore().subscribe()
const { isReady: areVmsReady } = useVmStore().subscribe()
const { isReady: areVmControllersReady } = useVmControllerStore().subscribe()
const { isReady: areSrsReady } = useSrStore().subscribe()

const areAlarmsReady = computed(() => {
  return (
    poolDashboard?.alarms !== undefined &&
    areHostsReady.value &&
    areVmsReady.value &&
    areVmControllersReady.value &&
    areSrsReady.value
  )
})

const uiStore = useUiStore()

const alarms = computed(() => {
  if (!poolDashboard?.alarms) {
    return []
  }

  return poolDashboard.alarms
    .reduce((acc, alarmId) => {
      const alarm = get(alarmId)
      if (alarm !== undefined) {
        acc.push(alarm)
      }

      return acc
    }, [] as XoAlarm[])
    .sort((alarm1, alarm2) => new Date(alarm2.time).getTime() - new Date(alarm1.time).getTime())
})
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  max-height: 46.2rem;

  .alarm-items {
    overflow: auto;
    margin-inline: -2.4rem;
    margin-block-end: -1.2rem;
  }
}
</style>
