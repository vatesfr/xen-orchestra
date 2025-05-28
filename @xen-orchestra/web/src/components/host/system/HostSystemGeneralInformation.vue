<template>
  <UiCard>
    <UiTitle>
      {{ $t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('name')" :value="host.name_label" />
    <VtsQuickInfoRow :label="$t('uuid')" :value="host.id" />
    <VtsQuickInfoRow :label="$t('description')" :value="host.name_description" />
    <VtsQuickInfoRow :label="$t('tags')">
      <template v-if="host.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in host.tags" :key="tag" accent="info" variant="secondary">
            {{ tag }}
          </UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('status')">
      <template #value>
        <VtsEnabledState :enabled="host.enabled" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('pool')">
      <template v-if="pool !== undefined" #value>
        <UiLink size="medium" :to="`/pool/${pool.id}/`" :icon="faCity">
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
        <UiLink v-else-if="masterHost !== undefined" size="medium" :to="`/host/${masterHost.id}/`" :icon="faServer">
          {{ masterHost.name_label }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('started')">
      <template v-if="host.power_state === HOST_POWER_STATE.RUNNING" #value>
        <VtsRelativeTime :date="host.startTime * 1000" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('power-on-mode')">
      <template #value>
        <VtsEnabledState :enabled="host.powerOnMode !== ''" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store.ts'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store.ts'
import { HOST_POWER_STATE, type XoHost } from '@/types/xo/host.type.ts'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCity, faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XoHost
}>()

const { get: getPoolById } = usePoolStore().subscribe()
const { getMasterHostByPoolId, isMasterHost } = useHostStore().subscribe()

const pool = computed(() => getPoolById(host.$pool))

const isMaster = computed(() => isMasterHost(host.id))

const masterHost = computed(() => getMasterHostByPoolId(host.$pool))
</script>
