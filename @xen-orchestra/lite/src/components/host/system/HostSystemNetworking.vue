<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <UiLabelValue :label="t('ip-address')" :value="host.address" />
    <UiLabelValue :label="t('remote-syslog')" :value="host.logging.syslog_destination" />
    <UiLabelValue :label="t('iscsi-iqn')" :value="host.iscsi_iqn" />
    <UiLabelValue :label="t('multi-pathing')">
      <template #value>
        <VtsStatus :status="host.multipathing" />
      </template>
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()
</script>
