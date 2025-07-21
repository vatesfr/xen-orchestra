<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>
      {{ t('alarms') }}
      <UiCounter v-if="alarms.length !== 0" accent="danger" size="small" variant="primary" :value="alarms.length" />
    </UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <VtsAllGoodHero v-else-if="alarms.length === 0" type="card" />
    <UiAlarmList v-else>
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
  </UiCard>
</template>

<script setup lang="ts">
import AlarmLink from '@/components/pool/dashboard/alarms/AlarmLink.vue'
import { useAlarmStore } from '@/stores/xo-rest-api/alarm.store.ts'
import VtsAllGoodHero from '@core/components/state-hero/VtsAllGoodHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: alarms, isReady } = useAlarmStore().subscribe()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  max-height: 46.2rem;
  overflow: auto;
}
</style>
