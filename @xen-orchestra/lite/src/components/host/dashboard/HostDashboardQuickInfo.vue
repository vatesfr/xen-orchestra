<template>
  <VtsQuickInfoCard class="host-dashboard-quick-info" :loading="!isReady">
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('state')">
        <template #value>
          <VtsIcon :accent="powerState.accent" :icon="powerState.icon" />
          {{ powerState.text }}
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('ip-address')" :value="host.address" />
      <VtsQuickInfoRow :label="$t('started')" :value="isRunning ? relativeStartTime : undefined" />
      <VtsQuickInfoRow :label="$t('master')">
        <template #value>
          <template v-if="isMaster">
            <VtsIcon v-tooltip="$t('master')" accent="info" :icon="faCircle" :overlay-icon="faStar" />
            {{ $t('this-host') }}
          </template>
          <UiLink v-else-if="masterHost !== undefined" :to="`/host/${masterHost.uuid}/`" size="medium" :icon="faServer">
            {{ masterHost.name_label }}
          </UiLink>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('uuid')" :value="host.uuid" />
      <VtsQuickInfoRow :label="$t('description')" :value="host.name_description" />
      <VtsQuickInfoRow :label="$t('version')" :value="host.software_version.product_version" />
      <VtsQuickInfoRow
        :label="$t('hardware')"
        :value="`${host.bios_strings['system-manufacturer']} (${host.bios_strings['system-product-name']})`"
      />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow
        :label="$t('cores-with-sockets')"
        :value="`${host.cpu_info.cpu_count} (${host.cpu_info.socket_count})`"
      />
      <VtsQuickInfoRow :label="$t('ram')" :value="`${ram?.value} ${ram?.prefix}`" />
      <VtsQuickInfoRow :label="$t('tags')">
        <template #value>
          <UiTagsList v-if="host.tags.length">
            <UiTag v-for="tag in host.tags" :key="tag" accent="neutral" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsIcon, { type IconAccent } from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import useRelativeTime from '@core/composables/relative-time.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { formatSizeRaw } from '@core/utils/size.util'
import { parseDateTime } from '@core/utils/time.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCircle, faPlay, faServer, faStar, faStop } from '@fortawesome/free-solid-svg-icons'
import { useNow } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { isMasterHost, masterHost, isReady: isPoolReady } = usePoolStore().subscribe()
const { isReady: isHostReady } = useHostStore().subscribe()
const { isHostRunning, getHostMemory, isReady: isHostMetricsReady } = useHostMetricsStore().subscribe()

const isReady = logicAnd(isPoolReady, isHostReady, isHostMetricsReady)

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

const isRunning = computed(() => isHostRunning(host))

const powerState = computed(() => ({
  text: t(`host-status.${isRunning.value ? 'running' : 'halted'}`),
  ...powerStateConfig[isRunning.value ? 'running' : 'halted'],
}))

const date = computed(() => new Date(parseDateTime(Number(host.other_config.boot_time) * 1000)))
const now = useNow({ interval: 1000 })
const relativeStartTime = useRelativeTime(date, now)

const isMaster = computed(() => isMasterHost(host.$ref))

const ram = computed(() => {
  const memory = getHostMemory(host)

  return formatSizeRaw(memory?.size, 0)
})
</script>
