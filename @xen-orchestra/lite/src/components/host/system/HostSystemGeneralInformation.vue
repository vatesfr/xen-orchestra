<template>
  <UiCard>
    <UiTitle>
      {{ $t('general-information') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <template #key> {{ $t('name') }}</template>
      <template #value> {{ host.name_label }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('id') }}
      </template>
      <template #value>
        {{ host.uuid }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('description') }}
      </template>
      <template #value>
        {{ host.name_description }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('tags') }}
      </template>
      <template #value>
        <UiTagsList class="value">
          <UiTag v-for="tag in host?.tags" :key="tag" accent="info" variant="secondary">
            {{ tag }}
          </UiTag>
        </UiTagsList>
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('status') }}
      </template>
      <template #value>
        <VtsStatusMode :status="isHostRunning(host)" />
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('pool') }}
      </template>
      <template #value>
        <UiObjectLink v-if="pool" :route="`/pool/${pool.uuid}/`" :icon="faCity">
          {{ pool.name_label }}
        </UiObjectLink>
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('primary-host') }}
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
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('started') }}
      </template>
      <template #value>
        <VtsRelativeTime :date="host.other_config.boot_time * 1000" />
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('power-on-mode') }}
      </template>
      <template #value>
        <VtsStatusMode :status="host.power_on_mode" />
      </template>
    </VtsCardRowKeyValue>
  </UiCard>
</template>

<script setup lang="ts">
import VtsRelativeTime from '@/components/RelativeTime.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatusMode from '@core/components/status-mode/VtsStatusMode.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCity, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { records, isMasterHost, masterHost } = usePoolStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

const pool = computed(() => records.value[0])
const isMaster = computed(() => isMasterHost(host.$ref))
</script>

<style lang="postcss" scoped>
:deep(.key),
:deep(.value) {
  width: auto !important;
  min-width: unset !important;
}

:deep(.vts-card-row-key-value) {
  gap: 2.4rem !important;
}

.value:empty::before {
  content: '-';
}
</style>
