<template>
  <UiCard>
    <UiTitle>
      {{ t('software-tooling') }}
    </UiTitle>
    <UiLabelValue :label="t('version')" :value="host.version" />
    <UiLabelValue :label="t('build-number')" :value="host.build" />
    <UiLabelValue :label="t('toolstack-uptime')">
      <template v-if="host.power_state === HOST_POWER_STATE.RUNNING" #value>
        <VtsRelativeTime :date="Number(host.agentStartTime) * 1000" />
      </template>
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import { HOST_POWER_STATE, type XoHost } from '@/types/xo/host.type.ts'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XoHost
}>()

const { t } = useI18n()
</script>
