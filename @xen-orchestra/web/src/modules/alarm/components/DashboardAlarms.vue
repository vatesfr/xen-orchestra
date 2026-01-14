<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('alarms') }}
      <UiCounter
        v-if="rawAlarms.length !== 0 && areAlarmsReady"
        accent="danger"
        size="small"
        variant="primary"
        :value="rawAlarms.length"
      />
    </UiCardTitle>
    <VtsStateHero v-if="!areAlarmsReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="rawAlarms.length === 0" format="card" type="all-good" horizontal size="medium">
      {{ t('no-alarm-detected') }}
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
import AlarmLink from '@/modules/alarm/components/AlarmLink.vue'
import { useXoAlarmCollection } from '@/modules/alarm/remote-resources/use-xo-alarm-collection.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useVirtualList } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { alarms: rawAlarms, hasAlarmFetchError: hasError } = useXoAlarmCollection()
const { areHostsReady } = useXoHostCollection()
const { areVmsReady } = useXoVmCollection()
const { areVmControllersReady } = useXoVmControllerCollection()
const { areSrsReady } = useXoSrCollection()

const areAlarmsReady = logicAnd(areHostsReady, areVmsReady, areVmControllersReady, areSrsReady)

const { t } = useI18n()

const uiStore = useUiStore()

const {
  list: alarms,
  containerProps,
  wrapperProps,
} = useVirtualList(
  computed(() => rawAlarms.value),
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
