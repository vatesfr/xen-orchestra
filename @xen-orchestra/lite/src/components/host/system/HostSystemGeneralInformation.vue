<template>
  <UiCard>
    <UiTitle>
      {{ $t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('name')" :value="host.name_label" />
    <VtsQuickInfoRow :label="$t('uuid')" :value="host.uuid" />
    <VtsQuickInfoRow :label="$t('description')" :value="host.name_description" />
    <VtsQuickInfoRow :label="$t('tags')">
      <template v-if="host.tags.length > 0" #value>
        <UiTagsList class="value">
          <UiTag v-for="tag in host.tags" :key="tag" accent="info" variant="secondary">
            {{ tag }}
          </UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('status')">
      <template #value>
        <VtsEnabledState :enabled="isRunning" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('pool')">
      <template v-if="pool" #value>
        <UiLink size="medium" :to="`/pool/${pool.uuid}/`" :icon="faCity">
          {{ pool.name_label }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('primary-host')">
      <template #value>
        <template v-if="isMaster">
          <VtsIcon v-tooltip="$t('master')" accent="info" :icon="faCircle" :overlay-icon="faStar" />
          {{ $t('this-host') }}
        </template>
        <UiLink
          v-else-if="masterHost !== undefined"
          size="medium"
          :to="`/host/${masterHost.uuid}/dashboard`"
          :icon="faServer"
        >
          {{ masterHost.name_label }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('started')">
      <template v-if="isRunning" #value>
        <VtsRelativeTime :date="host.other_config.boot_time * 1000" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('power-on-mode')">
      <template #value>
        <VtsEnabledState :enabled="host.power_on_mode !== ''" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import VtsRelativeTime from '@/components/RelativeTime.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCity, faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { pool, isMasterHost, masterHost } = usePoolStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

const isMaster = computed(() => isMasterHost(host.$ref))
const isRunning = computed(() => isHostRunning(host))
</script>
