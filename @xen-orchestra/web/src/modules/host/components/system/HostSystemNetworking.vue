<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('ip-address')" no-value-tooltip>
      <template #value>
        <span v-tooltip class="text-ellipsis">{{ host.address }}</span>
        <VtsCopyButton v-if="host.address" :value="host.address" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('remote-syslog')" :value="host.logging.syslog_destination" />
    <VtsQuickInfoRow :label="t('iscsi-iqn')" no-value-tooltip>
      <template #value>
        <span v-tooltip class="text-ellipsis">{{ host.iscsiIqn }}</span>
        <VtsCopyButton v-if="host.iscsiIqn" :value="host.iscsiIqn" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('multi-pathing')">
      <template #value>
        <VtsStatus :status="host.multipathing" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()
</script>
