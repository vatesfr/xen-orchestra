<template>
  <UiCard class="pool-dashboard-alarms">
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
    <VtsStateHero v-if="!isReady" format="card" busy />
    <VtsStateHero v-else-if="alarms.length === 0" format="card" type="all-good" horizontal>
      <span>{{ t('all-good') }}</span>
      <span>{{ t('no-alarms-detected') }}</span>
    </VtsStateHero>
    <div v-else class="alarm-list-container">
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
import { useXoAlarmCollection } from '@/remote-resources/use-xo-alarm-collection.ts'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/remote-resources/use-xo-vm-controller-collection.ts'
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const { useGetAlarmsByIds, areAlarmsReady } = useXoAlarmCollection()
const { areHostsReady } = useXoHostCollection()
const { areVmsReady } = useXoVmCollection()
const { areVmControllersReady } = useXoVmControllerCollection()
const { areSrsReady } = useXoSrCollection()

const isReady = logicAnd(areAlarmsReady, areHostsReady, areVmsReady, areVmControllersReady, areSrsReady)

const uiStore = useUiStore()

const alarms = useGetAlarmsByIds(() => poolDashboard?.alarms ?? [])
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  max-height: 46.2rem;

  .alarm-list-container {
    overflow: auto;
    margin-inline: -2.4rem;
    margin-block-end: -1.2rem;
  }
}
</style>
