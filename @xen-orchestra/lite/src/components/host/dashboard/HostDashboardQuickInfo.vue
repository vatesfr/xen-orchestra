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
      <VtsQuickInfoRow :label="$t('started')" :value="relativeStartTime" />
      <VtsQuickInfoRow>
        <template #label>
          {{ $t('master') }}
        </template>
        <template #value>
          <template v-if="isMaster">
            <VtsIcon v-tooltip="$t('master')" accent="info" :icon="faCircle" :overlay-icon="faStar" />
            {{ $t('this-host') }}
          </template>
          <UiObjectLink v-else-if="masterHost !== undefined" :route="`/host/${masterHost.uuid}/dashboard`">
            <template #icon>
              <UiObjectIcon size="medium" :state="isHostRunning(masterHost) ? 'running' : 'halted'" type="host" />
            </template>
            {{ masterHost.name_label }}
          </UiObjectLink>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('id')" :value="host.uuid" />
      <VtsQuickInfoRow :label="$t('description')" :value="host.name_description" />
      <VtsQuickInfoRow :label="$t('version')" :value="host.software_version.product_version" />
      <VtsQuickInfoRow :label="$t('hardware')">
        <template #value>
          {{ host.bios_strings['system-manufacturer'] }}
          {{ `(${host.bios_strings['system-product-name']})` }}
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('cores-with-sockets')">
        <template #value>{{ host.cpu_info.cpu_count }} {{ `(${host.cpu_info.socket_count})` }}</template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('ram')">
        <template #value>{{ `${ram?.value} ${ram?.prefix}` }}</template>
      </VtsQuickInfoRow>
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
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
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
  host: XenApiHost
}>()

const { t } = useI18n()

const { isMasterHost, masterHost } = usePoolStore().subscribe()
const { isReady } = useHostStore().subscribe()
const { isHostRunning, getHostMemory } = useHostMetricsStore().subscribe()

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
  const isRunning = isHostRunning(host)

  return {
    text: t(`host-status.${isRunning ? 'running' : 'halted'}`),
    ...powerStateConfig[isRunning ? 'running' : 'halted'],
  }
})

const date = computed(() => new Date(parseDateTime(Number(host.other_config.boot_time) * 1000)))
const now = useNow({ interval: 1000 })
const relativeStartTime = useRelativeTime(date, now)

const isMaster = computed(() => isMasterHost(host.$ref))

const ram = computed(() => {
  const memory = getHostMemory(host)

  return formatSizeRaw(memory?.size, 0)
})
</script>
