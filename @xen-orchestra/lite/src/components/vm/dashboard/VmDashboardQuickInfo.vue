<template>
  <VtsQuickInfoCard class="vm-dashboard-quick-info" :loading="!isReady">
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('state')">
        <template #value>
          <span class="power-state">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('ip-address')" :value="mainIpAddress" />
      <VtsQuickInfoRow :label="t('created-on')" :value="installDateFormatted" />
      <VtsQuickInfoRow :label="t('started')" :value="relativeStartTime" />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('uuid')" :value="vm.uuid" />
      <VtsQuickInfoRow :label="t('host')">
        <template #value>
          <span v-if="host" class="host-name">
            <VtsObjectIcon type="host" :state="hostPowerState" size="medium" />
            <UiLink :to="`/host/${host.uuid}`" size="medium">
              {{ host.name_label }}
            </UiLink>
            <VtsIcon v-if="isPoolMaster" v-tooltip="t('master')" name="legacy:primary" size="medium" />
          </span>
          <span v-else>
            {{ t('none') }}
          </span>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('description')" :value="vm.name_description" />
      <VtsQuickInfoRow :label="t('os-name')" :value="osVersion" />
      <VtsQuickInfoRow :label="t('virtualization-type')" :value="virtualizationType" />
      <VtsQuickInfoRow :label="t('guest-tools')" :value="guestTools" />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('vcpus')" :value="String(vm.VCPUs_at_startup)" />
      <VtsQuickInfoRow :label="t('ram')" :value="`${ram.value} ${ram.prefix}`" />
      <VtsQuickInfoRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="vm.tags.length > 0">
            <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useMapper } from '@core/packages/mapper'
import { formatSizeRaw } from '@core/utils/size.util'
import { parseDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t, locale } = useI18n()

const { isReady, getVmHost } = useVmStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()
const { getByOpaqueRef: getMetricsByOpaqueRef } = useVmMetricsStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()
const { pool } = usePoolStore().subscribe()

const guestMetrics = computed(() => getGuestMetricsByOpaqueRef(vm.guest_metrics))

const metrics = computed(() => getMetricsByOpaqueRef(vm.metrics))

const host = computed(() => getVmHost(vm))

const isPoolMaster = computed(() => pool.value?.master === host.value?.$ref)

const hostPowerState = computed(() => {
  if (host.value === undefined) {
    return 'unknown'
  }

  return isHostRunning(host.value) ? 'running' : 'halted'
})

const powerState = useMapper(
  () => vm.power_state,
  {
    [VM_POWER_STATE.RUNNING]: { icon: 'legacy:running', text: t('vm:status:running') },
    [VM_POWER_STATE.HALTED]: { icon: 'legacy:halted', text: t('vm:status:halted') },
    [VM_POWER_STATE.PAUSED]: { icon: 'legacy:paused', text: t('vm:status:paused') },
    [VM_POWER_STATE.SUSPENDED]: { icon: 'legacy:suspended', text: t('vm:status:suspended') },
  },
  VM_POWER_STATE.RUNNING
)

function getValidDateTime(dateTime: string | undefined): string | undefined {
  return dateTime === '19700101T00:00:00Z' ? undefined : dateTime
}

const startTime = computed(() => {
  const dateTime = getValidDateTime(metrics.value?.start_time)

  return dateTime ? new Date(parseDateTime(dateTime)) : undefined
})

const vmTimeAgo = useTimeAgo(() => startTime.value ?? 0)

const relativeStartTime = computed(() => {
  if (startTime.value === undefined) {
    return t('not-running')
  }

  return vmTimeAgo.value
})

const installDateFormatted = computed(() => {
  const installTime = getValidDateTime(metrics.value?.install_time)

  if (installTime === undefined) {
    return t('unknown')
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(parseDateTime(installTime)))
})

const ram = computed(() => formatSizeRaw(vm.memory_dynamic_max, 0))

const osVersion = computed(() => guestMetrics.value?.os_version.name)

const domainType = computed(() => {
  if (
    vm.domain_type !== undefined && // XS < 7.5
    vm.domain_type !== 'unspecified' // detection failed
  ) {
    return vm.domain_type
  }

  return vm.HVM_boot_policy === '' ? 'pv' : 'hvm'
})

const virtualizationType = computed(() =>
  domainType.value === 'hvm' && guestMetrics.value?.PV_drivers_detected ? 'pvhvm' : domainType.value
)

const guestTools = computed(() => {
  const version = guestMetrics.value?.PV_drivers_version

  if (!guestMetrics.value?.PV_drivers_detected || !version) {
    return ''
  }

  if (Object.entries(version).length === 0) {
    return ''
  }

  return `${version.major}.${version.minor}.${version.micro}-${version.build}`
})

const mainIpAddress = computed(() => {
  if (!guestMetrics.value?.networks) {
    return undefined
  }

  return [...new Set(Object.values(guestMetrics.value.networks).sort())][0]
})
</script>

<style lang="postcss" scoped>
.vm-dashboard-quick-info {
  .power-state,
  .host-name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .host-name {
    min-width: 0;
  }
}
</style>
