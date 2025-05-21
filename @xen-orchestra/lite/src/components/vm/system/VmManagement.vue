<template>
  <UiCard>
    <UiTitle>
      {{ $t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template #value>
        <VtsEnabledState :enabled="vm.ha_restart_priority !== ''" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('affinity-host')">
      <template v-if="affinityHost?.uuid" #value>
        <UiLink :icon="faServer" :to="`/host/${affinityHost.uuid}`" size="medium">
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
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { useArraySome } from '@vueuse/shared'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { getByOpaqueRef } = useHostStore().subscribe()

const affinityHost = computed(() => (vm.affinity ? getByOpaqueRef(vm.affinity) : undefined))

const protectedOperations = [
  VM_OPERATION.CLEAN_REBOOT,
  VM_OPERATION.CLEAN_SHUTDOWN,
  VM_OPERATION.HARD_REBOOT,
  VM_OPERATION.HARD_SHUTDOWN,
  VM_OPERATION.PAUSE,
  VM_OPERATION.SUSPEND,
  VM_OPERATION.SHUTDOWN,
]

const isProtectedFromAccidentalShutdown = useArraySome(
  protectedOperations,
  operation => vm.blocked_operations[operation] !== undefined
)
</script>
