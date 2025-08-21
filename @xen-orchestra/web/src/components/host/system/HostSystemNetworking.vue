<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('ip-address')" :value="host.address" />
    <VtsQuickInfoRow :label="t('remote-syslog')" :value="host.logging.syslog_destination" />
    <VtsQuickInfoRow :label="t('iscsi-iqn')" :value="host.iscsiIqn" />
    <VtsQuickInfoRow :label="t('multi-pathing')">
      <template #value>
        <VtsEnabledState :enabled="host.multipathing" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoHost } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XoHost
}>()

const { t } = useI18n()
</script>
