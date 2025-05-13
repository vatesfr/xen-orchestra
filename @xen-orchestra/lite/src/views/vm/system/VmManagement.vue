<template>
  <UiCard class="vm-management">
    <UiTitle>
      {{ $t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template #value>
        <UiInfo :accent="vm.ha_restart_priority !== '' ? 'success' : 'muted'">
          {{ vm.ha_restart_priority ? $t(vm.ha_restart_priority) : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('affinity-host')">
      <template v-if="affinity?.uuid" #value>
        <UiLink :icon="faServer" :to="`/host/${affinity.uuid}`" size="small" target="_self">
          {{ affinity.name_label }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('protect-from-accidental-deletion')">
      <template #value>
        <UiInfo :accent="vm.blocked_operations?.destroy === 'true' ? 'success' : 'muted'">
          {{ vm.blocked_operations?.destroy === 'true' ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('protect-from-accidental-shutdown')">
      <template #value>
        <UiInfo :accent="protectedFromAccidentalShutdown ? 'success' : 'muted'">
          {{ protectedFromAccidentalShutdown ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('auto-power')">
      <template #value>
        <UiInfo :accent="vm.other_config.auto_poweron === 'true' ? 'success' : 'muted'">
          {{ vm.other_config.auto_poweron === 'true' ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('start-delay')">
      {{ $t('relative-time.second', vm.start_delay ?? NaN) }}
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { getByOpaqueRef: getMetricsByOpaqueRef } = useHostStore().subscribe()

const affinity = computed(() => (vm.affinity ? getMetricsByOpaqueRef(vm.affinity) : undefined))
const protectedFromAccidentalShutdown = computed(
  () =>
    vm.blockedOperations?.clean_reboot ||
    vm.blockedOperations?.clean_shutdown ||
    vm.blockedOperations?.hard_reboot ||
    vm.blockedOperations?.hard_shutdown ||
    vm.blockedOperations?.pause ||
    vm.blockedOperations?.suspend ||
    vm.blockedOperations?.shutdown
)
</script>
