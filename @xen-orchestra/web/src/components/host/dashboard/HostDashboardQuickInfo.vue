<template>
  <VtsQuickInfoCard class="host-dashboard-quick-info" :loading="!isReady">
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('state')">
        <template #value>
          <span class="power-state">
            <VtsIcon :accent="powerState.accent" :icon="powerState.icon" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('ip-address')" :value="host.address" />
      <VtsQuickInfoRow
        :label="$t('started')"
        :value="host.power_state === HOST_POWER_STATE.RUNNING ? relativeStartTime : undefined"
      />
      <VtsQuickInfoRow :label="$t('master')">
        <template #value>
          <template v-if="isMaster">
            <VtsIcon v-tooltip="$t('master')" accent="info" :icon="faCircle" :overlay-icon="faStar" />
            {{ $t('this-host') }}
          </template>
          <UiLink v-else-if="masterHost !== undefined" :to="`/host/${masterHost.id}/`" size="medium" :icon="faServer">
            {{ masterHost.name_label }}
          </UiLink>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('uuid')" :value="host.id" />
      <VtsQuickInfoRow :label="$t('description')" :value="host.name_description" />
      <VtsQuickInfoRow :label="$t('version')" :value="host.version" />
      <VtsQuickInfoRow
        :label="$t('hardware')"
        :value="`${host.bios_strings['system-manufacturer']} (${host.bios_strings['system-product-name']})`"
      />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="$t('cores-with-sockets')" :value="`${host.cpus.cores} (${host.cpus.sockets})`" />
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
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { HOST_POWER_STATE, type XoHost } from '@/types/xo/host.type'
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { getMasterHostByPoolId, isMasterHost, isReady } = useHostStore().subscribe()

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

const date = computed(() => new Date(parseDateTime(host.startTime * 1000)))
const now = useNow({ interval: 1000 })
const relativeStartTime = useRelativeTime(date, now)

const isMaster = computed(() => isMasterHost(host.id))
const masterHost = computed(() => getMasterHostByPoolId(host.$pool))

const ram = computed(() => formatSizeRaw(host.memory.size, 1))
</script>

<style lang="postcss" scoped>
.host-dashboard-quick-info {
  .power-state {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
</style>
