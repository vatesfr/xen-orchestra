<template>
  <UiCard>
    <UiTitle>
      {{ $t('networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('ip-address')" :value="host.address" />
    <VtsQuickInfoRow
      :label="$t('remote-syslog')"
      :value="host.logging.syslog_destination !== undefined ? host.logging.syslog_destination : $t('none')"
    />
    <VtsQuickInfoRow :label="$t('iscsi-iqn')" :value="host.iscsiIqn" />
    <VtsQuickInfoRow :label="$t('multi-pathing')">
      <template #value>
        <VtsEnabledState :enabled="host.multipathing" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { host } = defineProps<{
  host: XoHost
}>()
</script>
