<template>
  <UiCard>
    <UiTitle>
      {{ t('vm-management') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('high-availability')">
        <template #value>
          <VtsStatus :status="vm.high_availability !== ''" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('affinity-host')">
        <template #value>
          <UiLink
            v-if="vm.affinityHost"
            icon="object:host"
            :to="{ name: '/host/[id]/dashboard', params: { id: vm.affinityHost } }"
            size="small"
          >
            {{ affinityHostName }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('protect-from-accidental-deletion')">
        <template #value>
          <VtsStatus :status="vm.blockedOperations.destroy !== undefined" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('protect-from-accidental-shutdown')">
        <template #value>
          <VtsStatus :status="isProtectedFromAccidentalShutdown" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('auto-power')">
        <template #value>
          <VtsStatus :status="vm.auto_poweron" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('start-delay')" :value="formattedStartDelay" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { VM_OPERATIONS } from '@vates/types'
import { useArraySome } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()
const { t } = useI18n()

const { getHostById } = useXoHostCollection()

const affinityHostName = computed(() => (vm.affinityHost ? getHostById(vm.affinityHost)?.name_label : ''))
const protectedOperations = [
  VM_OPERATIONS.CLEAN_REBOOT,
  VM_OPERATIONS.CLEAN_SHUTDOWN,
  VM_OPERATIONS.HARD_REBOOT,
  VM_OPERATIONS.HARD_SHUTDOWN,
  VM_OPERATIONS.PAUSE,
  VM_OPERATIONS.SUSPEND,
  VM_OPERATIONS.SHUTDOWN,
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
    parts.push(t('relative-time:day', days))
  }

  if (hours > 0) {
    parts.push(t('relative-time:hour', hours))
  }

  if (minutes > 0) {
    parts.push(t('relative-time:minute', minutes))
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(t('relative-time:second', seconds))
  }

  return parts.join(' ')
})
</script>
