<template>
  <UiCard class="vm-management">
    <UiTitle>
      {{ $t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template #value>
        <VtsEnabledState :enabled="vm.platform.vga === 'std'" />

        <UiInfo :accent="vm.ha_restart_priority !== '' ? 'success' : 'muted'">
          {{ vm.ha_restart_priority ? $t(vm.ha_restart_priority) : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('affinity-host')">
      <template v-if="affinityHost?.uuid" #value>
        <UiLink :icon="faServer" :to="`/host/${affinityHost.uuid}`" size="medium" target="_self">
          {{ affinityHost.name_label }}
        </UiLink>
      </template>
      <template v-else #value>{{ $t('none') }}</template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('protect-from-accidental-deletion')">
      <template #value>
        <VtsEnabledState :enabled="vm.blocked_operations?.destroy === 'true'" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('protect-from-accidental-shutdown')">
      <template #value>
        <VtsEnabledState :enabled="isProtectedFromAccidentalShutdown !== undefined" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('auto-power')">
      <template #value>
        <VtsEnabledState :enabled="vm.other_config.auto_poweron === 'true'" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('start-delay')" :value="$t('relative-time.second', vm.start_delay)" />
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
import VtsEnabledState from '@core/enabled-state/VtsEnabledState.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { getByOpaqueRef } = useHostStore().subscribe()

const affinityHost = computed(() => (vm.affinity ? getByOpaqueRef(vm.affinity) : undefined))
const isProtectedFromAccidentalShutdown = computed(
  () =>
    vm.blocked_operations?.clean_reboot ||
    vm.blocked_operations?.clean_shutdown ||
    vm.blocked_operations?.hard_reboot ||
    vm.blocked_operations?.hard_shutdown ||
    vm.blocked_operations?.pause ||
    vm.blocked_operations?.suspend ||
    vm.blocked_operations?.shutdown
)
</script>
