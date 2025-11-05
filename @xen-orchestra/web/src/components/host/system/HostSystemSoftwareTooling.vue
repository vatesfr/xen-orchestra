<template>
  <UiCard>
    <UiTitle>
      {{ t('software-tooling') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('version')" :value="host.version" />
    <VtsQuickInfoRow :label="t('build-number')" :value="host.build" />
    <VtsQuickInfoRow :label="t('toolstack-uptime')">
      <template v-if="host.power_state === HOST_POWER_STATE.RUNNING" #value>
        <VtsRelativeTime :date="Number(host.agentStartTime) * 1000" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { HOST_POWER_STATE, type XoHost } from '@/types/xo/host.type.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XoHost
}>()

const { t } = useI18n()
</script>
