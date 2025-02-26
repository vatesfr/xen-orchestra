<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>
      {{ $t('alarms') }}
      <template v-if="isReady && alarms.length > 0" #right>
        <UiCounter :value="alarms.length" accent="danger" variant="primary" size="small" />
      </template>
    </UiCardTitle>
    <div v-if="!isStarted" class="pre-start">
      <div>
        <p class="text typo-h4">
          {{ $t('click-to-display-alarms') }}
        </p>
        <UiButton size="medium" accent="brand" variant="primary" @click="start">{{ $t('load-now') }}</UiButton>
      </div>
      <div>
        <img alt="" src="@/assets/server-status.svg" />
      </div>
    </div>
    <NoDataError v-else-if="hasError" />
    <div v-else-if="!isReady">
      <UiCardSpinner />
    </div>
    <div v-else-if="alarms.length === 0" class="no-alarm">
      <div>
        <img alt="" src="@/assets/server-status.svg" />
      </div>
      <p class="text typo-h4">{{ $t('all-good') }}<br />{{ $t('no-alarm-triggered') }}</p>
    </div>
    <div v-else class="table-container">
      <UiTable>
        <tbody>
          <AlarmRow v-for="alarm in alarms" :key="alarm.uuid" :alarm />
        </tbody>
      </UiTable>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import AlarmRow from '@/components/pool/dashboard/alarm/AlarmRow.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UiTable from '@/components/ui/UiTable.vue'
import { useAlarmStore } from '@/stores/xen-api/alarm.store'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'

const { records: alarms, start, isStarted, isReady, hasError } = useAlarmStore().subscribe({ defer: true })
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
