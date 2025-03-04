<template>
  <div class="dashboard">
    <!-- Quick Info -->
    <VtsQuickInfoCard class="quick-info" :is-ready>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :title="$t('state')">
          <template #value>
            <VtsIcon :accent="powerState.accent" :icon="powerState.icon" />
            {{ powerState.text }}
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :title="$t('ip-address')" :value="host.address" />
        <VtsQuickInfoRow :title="$t('started')" :value="relativeStartTime" />
        <VtsQuickInfoRow v-if="isMaster">
          <template #title>
            <VtsIcon v-tooltip="$t('master')" accent="info" :icon="faCircle" :overlay-icon="faStar" />
          </template>
          <template #value>
            {{ $t('is-primary-host', { name: host.name_label }) }}
          </template>
        </VtsQuickInfoRow>
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :title="$t('id')" :value="host.id" />
        <VtsQuickInfoRow :title="$t('description')" :value="host.name_description" />
        <VtsQuickInfoRow :title="$t('version')" :value="host.version" />
        <VtsQuickInfoRow :title="$t('hardware')">
          <template #value>
            {{ host.bios_strings['system-manufacturer'] }}
            {{ `(${host.bios_strings['system-product-name']})` }}
          </template>
        </VtsQuickInfoRow>
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :title="$t('cores-with-sockets')">
          <template #value>{{ host.cpus.cores }} {{ `(${host.cpus.sockets})` }}</template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :title="$t('ram')">
          <template #value>{{ `${ram?.value} ${ram?.prefix}` }}</template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow v-if="host.tags.length" :title="$t('tags')">
          <template #value>
            <UiTagsList>
              <UiTag v-for="tag in host.tags" :key="tag" accent="neutral" variant="secondary">{{ tag }}</UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsQuickInfoColumn>
    </VtsQuickInfoCard>
    <!-- VMs Status -->
    <UiCard class="vms-status">
      <UiCardTitle>{{ $t('vms-status') }}</UiCardTitle>
      <VtsLoadingHero :disabled="isReady" type="card">
        <VtsDonutChartWithLegend :segments="vmsSegments" />
        <UiCardNumbers class="total" :label="t('total')" :value="hostVms.length" size="small" />
      </VtsLoadingHero>
    </UiCard>
    <!-- CPU provisioning -->
    <UiCard class="cpu-provisioning">
      <UiCardTitle>{{ $t('cpu-provisioning') }}</UiCardTitle>
      <VtsLoadingHero :disabled="isReady" type="card">
        <!-- TODO: use Progress Bar -->
        <!-- <VtsDonutChartWithLegend :segments="vmsSegments" /> -->
        <div class="total">
          <UiCardNumbers :label="t('vcpus-used')" :value="cpuProvisioning.used" size="medium" />
          <UiCardNumbers :label="t('total-cpus')" :value="cpuProvisioning.total" size="medium" />
        </div>
      </VtsLoadingHero>
    </UiCard>
    <!-- RAM usage -->
    <UiCard class="ram-usage">
      <UiCardTitle>{{ $t('ram-usage') }}</UiCardTitle>
      <VtsLoadingHero :disabled="isReady" type="card">
        <!-- TODO: use Progress Bar -->
        <!-- <VtsDonutChartWithLegend :segments="vmsSegments" /> -->
        <div class="total">
          <UiCardNumbers
            :label="t('total-used')"
            :unit="ramUsage.used?.prefix"
            :value="ramUsage.used?.value"
            size="medium"
          />
          <UiCardNumbers
            :label="t('total-free')"
            :unit="ramUsage.free?.prefix"
            :value="ramUsage.free?.value"
            size="medium"
          />
        </div>
      </VtsLoadingHero>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import { type XoHost } from '@/types/xo/host.type'
import type { POWER_STATE } from '@core/types/power-state.type'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsIcon, { type IconAccent } from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import useRelativeTime from '@core/composables/relative-time.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { formatSizeRaw } from '@core/utils/size.util'
import { parseDateTime } from '@core/utils/time.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCircle, faPlay, faStar, faStop } from '@fortawesome/free-solid-svg-icons'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { isMasterHost, isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady } = useVmStore().subscribe()

const isReady = computed(() => isHostReady.value && areVmsReady.value)

const hostVms = computed(() => vmsByHost.value.get(host.id) ?? [])

// Power state
const powerStateConfig: Record<
  string,
  {
    icon: IconDefinition | undefined
    accent: IconAccent
  }
> = {
  running: { icon: faPlay, accent: 'success' },
  halted: { icon: faStop, accent: 'danger' },
  unknown: { icon: undefined, accent: 'warning' },
}

const powerState = computed(() => {
  const state = host.power_state.toLowerCase()
  const config = powerStateConfig[state]

  return {
    text: t(`host-status.${state}`),
    icon: config.icon,
    accent: config.accent,
  }
})

// Start time
const date = computed(() => new Date(parseDateTime(host.startTime * 1000)))
const now = useNow({ interval: 1000 })
const relativeStartTime = useRelativeTime(date, now)

// Is master host
const isMaster = computed(() => isMasterHost(host.id))

// Total RAM
const ram = computed(() => formatSizeRaw(host.memory.size, 1))

// VMs statuses for donut chart
const vmsStatuses = computed(() =>
  hostVms.value.reduce(
    (acc, vm) => {
      acc[vm.power_state.toLowerCase() as POWER_STATE] += 1

      return acc
    },
    {
      running: 0,
      paused: 0,
      suspended: 0,
      halted: 0,
    } as Record<POWER_STATE, number>
  )
)

const vmsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: vmsStatuses.value.running,
    accent: 'success',
  },
  {
    label: t('vms-status.inactive'),
    value: vmsStatuses.value.suspended + vmsStatuses.value.paused + vmsStatuses.value.halted,
    accent: 'info',
    tooltip: t('vms-status.inactive.tooltip'),
  },
  {
    label: t('vms-status.unknown'),
    value: 0,
    accent: 'muted',
    tooltip: t('vms-status.unknown.tooltip'),
  },
])

// CPU provisioning
const cpuProvisioning = computed(() => {
  const totalHostCpus = host.cpus.cores
  const totalVcpus = hostVms.value.reduce((acc, vm) => acc + (vm.CPUs?.number ?? 0), 0)

  return {
    total: totalHostCpus,
    used: totalVcpus,
    percent: totalHostCpus > 0 ? Math.round((totalVcpus / totalHostCpus) * 100) : 0,
  }
})

// RAM usage
const ramUsage = computed(() => {
  const total = host.memory.size
  const used = host.memory.usage

  return {
    total: formatSizeRaw(total, 0),
    used: formatSizeRaw(used, 0),
    free: formatSizeRaw(total - used, 0),
    percent: Math.round((used / total) * 100),
  }
})
</script>

<style lang="postcss" scoped>
.dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'vms-status vms-status cpu-provisioning cpu-provisioning cpu-provisioning ram-usage ram-usage ram-usage'
    'cpu-usage cpu-usage memory-usage memory-usage network-usage network-usage load-average load-average';

  .quick-info {
    grid-area: quick-info;
  }

  .vms-status {
    grid-area: vms-status;

    .total {
      margin-inline-start: auto;
    }
  }

  .cpu-provisioning {
    grid-area: cpu-provisioning;

    .total {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-block-start: auto;
    }
  }

  .ram-usage {
    grid-area: ram-usage;

    .total {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-block-start: auto;
    }
  }
}
</style>
