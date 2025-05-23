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
        <VtsEnabledState :enabled="isProtectedFromAccidentalShutdown" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('auto-power')">
      <template #value>
        <VtsEnabledState :enabled="vm.other_config.auto_poweron === 'true'" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('start-delay')" :value="formattedStartDelay" />
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
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XenApiVm }>()
const { t } = useI18n()

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

const formattedStartDelay = computed(() => {
  const days = Math.floor(vm.start_delay / 86_400)
  const hours = Math.floor((vm.start_delay % 86_400) / 3_600)
  const minutes = Math.floor((vm.start_delay % 3_600) / 60)
  const seconds = vm.start_delay % 60
  const parts = []

  if (days > 0) {
    parts.push(t('relative-time.day', days))
  }

  if (hours > 0) {
    parts.push(t('relative-time.hour', hours))
  }

  if (minutes > 0) {
    parts.push(t('relative-time.minute', minutes))
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(t('relative-time.second', seconds))
  }

  return parts.join(' ')
})
</script>
