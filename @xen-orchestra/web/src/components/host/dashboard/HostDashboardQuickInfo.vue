<template>
  <VtsQuickInfoCard class="host-dashboard-quick-info" :loading="!areHostsReady">
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('state')">
        <template #value>
          <span class="power-state">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('ip-address')" :value="host.address" />
      <VtsQuickInfoRow
        :label="t('started')"
        :value="host.power_state === HOST_POWER_STATE.RUNNING ? relativeStartTime : undefined"
      />
      <VtsQuickInfoRow :label="t('master')">
        <template #value>
          <template v-if="isMaster">
            <VtsIcon v-tooltip="t('master')" name="legacy:primary" size="medium" />
            {{ t('this-host') }}
          </template>
          <UiLink v-else-if="masterHost !== undefined" :to="`/host/${masterHost.id}/`" size="medium" icon="fa:server">
            {{ masterHost.name_label }}
          </UiLink>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('uuid')" :value="host.id" />
      <VtsQuickInfoRow :label="t('description')" :value="host.name_description" />
      <VtsQuickInfoRow :label="t('version')" :value="host.version" />
      <VtsQuickInfoRow
        :label="t('hardware')"
        :value="`${host.bios_strings['system-manufacturer']} (${host.bios_strings['system-product-name']})`"
      />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('cores-with-sockets')" :value="`${host.cpus.cores} (${host.cpus.sockets})`" />
      <VtsQuickInfoRow :label="t('ram')" :value="`${ram.value} ${ram.prefix}`" />
      <VtsQuickInfoRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="host.tags.length">
            <UiTag v-for="tag in host.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
import { HOST_POWER_STATE, type XoHost } from '@vates/types'
import { useNow } from '@vueuse/core'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { getMasterHostByPoolId, isMasterHost, areHostsReady } = useXoHostCollection()

const powerStateConfig: Record<Lowercase<HOST_POWER_STATE>, IconName | undefined> = {
  running: 'legacy:running',
  halted: 'legacy:halted',
  unknown: undefined,
}

const powerState = computed(() => {
  const state = toLower(host.power_state)

  return {
    text: t(`host-status.${state}`),
    icon: powerStateConfig[state],
  }
})

const date = computed(() => (host.startTime === null ? undefined : new Date(parseDateTime(host.startTime * 1000))))

const now = useNow({ interval: 1000 })

const baseRelativeStartTime = useRelativeTime(
  computed(() => (date.value === undefined ? now.value : date.value)),
  now
)

const relativeStartTime = computed(() => (date.value === undefined ? undefined : baseRelativeStartTime.value))

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
