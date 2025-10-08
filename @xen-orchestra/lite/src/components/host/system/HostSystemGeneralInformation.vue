<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <UiLabelValue :label="t('name')" :value="host.name_label" />
    <UiLabelValue :label="t('uuid')" :value="host.uuid" />
    <UiLabelValue :label="t('description')" :value="host.name_description" />
    <UiLabelValue :label="t('tags')" :value="host.tags" />
    <UiLabelValue :label="t('status')">
      <template #value>
        <VtsStatus :status="host.enabled" />
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('pool')">
      <template v-if="pool !== undefined" #value>
        <UiLink size="medium" :to="`/pool/${pool.uuid}/`" icon="fa:city" class="link">
          <div v-tooltip class="text-ellipsis">
            {{ pool.name_label }}
          </div>
        </UiLink>
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('master')">
      <template #value>
        <template v-if="isMaster">
          <VtsIcon v-tooltip="t('master')" name="legacy:primary" size="medium" />
          {{ t('this-host') }}
        </template>
        <UiLink v-else-if="masterHost !== undefined" size="medium" :to="`/host/${masterHost.uuid}/`" icon="fa:server">
          {{ masterHost.name_label }}
        </UiLink>
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('started')">
      <template v-if="isRunning" #value>
        <VtsRelativeTime :date="host.other_config.boot_time * 1000" />
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('power-on-mode')">
      <template #value>
        <VtsStatus :status="host.power_on_mode !== ''" />
      </template>
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import VtsRelativeTime from '@/components/RelativeTime.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { pool, isMasterHost, masterHost } = usePoolStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

const isMaster = computed(() => isMasterHost(host.$ref))
const isRunning = computed(() => isHostRunning(host))
</script>

<style lang="postcss" scoped>
.link {
  width: 100%;
}
</style>
