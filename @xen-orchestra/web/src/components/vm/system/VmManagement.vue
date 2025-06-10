<template>
  <UiCard>
    <UiTitle>
      {{ t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('high-availability')">
      <template #value>
        <VtsEnabledState :enabled="vm.high_availability !== ''" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('affinity-host')">
      <template #value>
        <UiLink v-if="vm.affinityHost" :icon="faServer" :to="`/host/${vm.affinityHost}`" size="small">
          {{ affinityHostName }}
        </UiLink>
        <template v-else>
          {{ t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('protect-from-accidental-deletion')">
      <template #value>
        <VtsEnabledState :enabled="vm.blockedOperations.destroy !== undefined" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('protect-from-accidental-shutdown')">
      <template #value>
        <VtsEnabledState :enabled="isProtectedFromAccidentalShutdown" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('auto-power')">
      <template #value>
        <VtsEnabledState :enabled="vm.auto_poweron" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('start-delay')" :value="formattedStartDelay" />
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { VM_OPERATION, type XoVm } from '@/types/xo/vm.type'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { useArraySome } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XoVm }>()
const { t } = useI18n()

const { get: getHostById } = useHostStore().subscribe()

const affinityHostName = computed(() => (vm.affinityHost ? getHostById(vm.affinityHost)?.name_label : ''))
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
  operation => vm.blockedOperations[operation] !== undefined
)

const formattedStartDelay = computed(() => {
  const days = Math.floor(vm.startDelay / 86_400)
  const hours = Math.floor((vm.startDelay % 86_400) / 3_600)
  const minutes = Math.floor((vm.startDelay % 3_600) / 60)
  const seconds = vm.startDelay % 60
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
