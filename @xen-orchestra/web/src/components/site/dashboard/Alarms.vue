<template>
  <UiCard class="site-dashboard-alarms">
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
import AlarmLink from '@/components/site/dashboard/AlarmLink.vue'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/remote-resources/use-xo-vm-controller-collection.ts'
import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import VtsAllGoodHero from '@core/components/state-hero/VtsAllGoodHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'
import { useI18n } from 'vue-i18n'

const { alarms } = defineProps<{
  alarms: XoAlarm[]
}>()

const { t } = useI18n()

const { areHostsReady } = useXoHostCollection()
const { areVmsReady } = useXoVmCollection()
const { areVmControllersReady } = useXoVmControllerCollection()
const { areSrsReady } = useXoSrCollection()

const areAlarmsReady = logicAnd(areHostsReady, areVmsReady, areVmControllersReady, areSrsReady)

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.site-dashboard-alarms {
  max-height: 40.6rem;

  .alarm-list-container {
    overflow: auto;
    margin-inline: -2.4rem;
    margin-block-end: -1.2rem;
  }
}
</style>
