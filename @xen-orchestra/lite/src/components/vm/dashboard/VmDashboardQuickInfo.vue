<template>
  <VtsQuickInfoCard class="vm-dashboard-quick-info" :loading="!isReady">
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('state')">
        <template #value>
          <span class="power-state">
            <VtsIcon :accent="powerState.accent" :icon="powerState.icon" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('ip-address')" :value="mainIpAddress" />
      <VtsQuickInfoRow :label="$t('created-on')" :value="installDateFormatted" />
      <VtsQuickInfoRow :label="$t('started')" :value="relativeStartTime" />
      <VtsQuickInfoRow :label="$t('host')">
        <template #value>
          <span v-if="getVmHost(vm)" class="host-name">
            <UiObjectIcon size="medium" type="host" />
            {{ getVmHost(vm)?.name_label }}
          </span>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('id')" :value="vm.uuid" />
      <VtsQuickInfoRow :label="$t('description')" :value="vm.name_description" />
      <VtsQuickInfoRow :label="$t('os-name')" :value="osVersion" />
      <VtsQuickInfoRow :label="$t('virtualization-type')">
        <template #value>{{ virtualizationType }}</template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('vcpus')">
        <template #value>{{ vm.VCPUs_at_startup }}</template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('ram')">
        <template #value>{{ `${ram?.value} ${ram?.prefix}` }}</template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('tags')">
        <template #value>
          <UiTagsList v-if="vm.tags.length > 0">
            <UiTag v-for="tag in vm.tags" :key="tag" accent="neutral" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsIcon, { type IconAccent } from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t } = useI18n()

const { isReady, getVmHost } = useVmStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()
const { getByOpaqueRef: getMetricsByOpaqueRef } = useVmMetricsStore().subscribe()

const guestMetrics = computed(() => getGuestMetricsByOpaqueRef(vm.guest_metrics))

const metrics = computed(() => getMetricsByOpaqueRef(vm.metrics))

const powerStateConfig: Record<
  string,
  {
    icon: IconDefinition | undefined
    accent: IconAccent
  }
> = {
  running: { icon: faPlay, accent: 'success' },
  halted: { icon: faStop, accent: 'danger' },
}

const powerState = computed(() => {
  const isRunning = vm.power_state === 'Running'

  return {
    text: t(`vms-status.${isRunning ? 'running' : 'halted'}`),
    ...powerStateConfig[isRunning ? 'running' : 'halted'],
  }
})

function toIsoDate(str: string): string {
  return str.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2}:\d{2}:\d{2}Z)$/, '$1-$2-$3T$4')
}

const startTime = computed(() => metrics.value?.start_time)
const isoStartTime = computed(() => (startTime.value ? toIsoDate(startTime.value) : undefined))
const startedDate = computed(() => (isoStartTime.value ? new Date(isoStartTime.value) : undefined))
const relativeStartTime = computed(() => (startedDate.value ? useTimeAgo(startedDate.value).value : ''))

const installTime = computed(() =>
  metrics.value?.install_time === '19700101T00:00:00Z' ? undefined : metrics.value?.install_time
)
const isoInstallTime = computed(() => (installTime.value ? toIsoDate(installTime.value) : undefined))
const installDate = computed(() => (isoInstallTime.value ? new Date(isoInstallTime.value) : undefined))
const installDateFormatted = computed(() =>
  installDate.value
    ? installDate.value.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : t('unknown')
)

const ram = computed(() => {
  const memory = vm.memory_dynamic_max

  return formatSizeRaw(memory, 0)
})

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

const mainIpAddress = computed(() => {
  if (!guestMetrics.value?.networks) return undefined

  return [...new Set(Object.values(guestMetrics.value.networks).sort())][0]
})
</script>

<style lang="postcss" scoped>
.vm-dashboard-quick-info {
  .power-state,
  .host-name {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
</style>
