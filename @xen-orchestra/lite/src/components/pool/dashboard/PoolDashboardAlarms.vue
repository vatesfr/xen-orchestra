<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>
      {{ t('alarms') }}
      <template v-if="isReady && alarms.length > 0" #right>
        <UiCounter :value="alarms.length" accent="danger" variant="primary" size="small" />
      </template>
    </UiCardTitle>
    <div v-if="!isStarted" class="pre-start">
      <div>
        <p class="text typo-h4">
          {{ t('click-to-display-alarms:') }}
        </p>
        <UiButton size="medium" accent="brand" variant="primary" @click="start">{{ t('action:load-now') }}</UiButton>
      </div>
      <div>
        <img alt="" src="@/assets/server-status.svg" />
      </div>
    </div>
    <div v-else class="table-container">
      <VtsTable :state>
        <tbody>
          <VtsRow v-for="alarm of alarms" :key="alarm.uuid">
            <BodyCells :item="alarm" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import ObjectLink from '@/components/ObjectLink.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import type { RawObjectType } from '@/libs/xen-api/xen-api.types'
import { rawTypeToType } from '@/libs/xen-api/xen-api.utils'
import { useAlarmStore } from '@/stores/xen-api/alarm.store'
import type { XenApiAlarm } from '@/types/xen-api'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { defineColumn, defineColumns } from '@core/packages/table'
import { useDateColumn } from '@core/tables/column-definitions/date-column'
import { usePercentColumn } from '@core/tables/column-definitions/percent-column'
import { useTextColumn } from '@core/tables/column-definitions/text-column'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import { logicNot } from '@vueuse/math'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: alarms, start, isStarted, isReady, hasError } = useAlarmStore().subscribe({ defer: true })

// Warning: Alarm system will be completely revamped in the future.
// This is a temporary solution to display alarms.
// Don't move this code outside of this file.

const useLegacyObjectLinkColumn = defineColumn(() => ({
  renderHead: () => renderHeadCell(),
  renderBody: (type: RawObjectType, uuid: string) =>
    renderBodyCell(() => h(ObjectLink, { type: rawTypeToType(type), uuid: uuid as any })),
}))

const useAlarmColumns = defineColumns(() => ({
  time: useDateColumn(),
  description: useTextColumn(),
  level: usePercentColumn(),
  onObject: useTextColumn(),
  object: useLegacyObjectLinkColumn(),
}))

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () => (alarms.value.length === 0 ? { type: 'all-good', message: t('no-alarm-detected') } : false),
})

const { BodyCells } = useAlarmColumns({
  body: (alarm: XenApiAlarm<RawObjectType>) => ({
    time: r => r(alarm.timestamp, { relative: true }),
    description: r => r(t(`alarm-type:${alarm.type}`, { n: alarm.triggerLevel * 100 })),
    level: r => r(Math.min(alarm.level, 1)),
    onObject: r => r(t('on-object', { object: alarm.cls })),
    object: r => r(alarm.cls, alarm.obj_uuid),
  }),
})
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  min-width: 0;
}

.pre-start,
.no-alarm {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
}

.text {
  .pre-start & {
    margin-bottom: 2rem;
  }

  .no-alarm & {
    color: var(--color-success-txt-base);
  }
}

.table-container {
  max-height: 25rem;
  overflow: auto;
}
</style>
