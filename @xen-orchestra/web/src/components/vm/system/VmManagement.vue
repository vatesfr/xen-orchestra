<template>
  <UiCard>
    <UiTitle>
      {{ $t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template #value>
        <VtsEnabledState :enabled="vm.high_availability !== ''" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('affinity-host')">
      <template #value>
        <UiLink v-if="vm.affinityHost" :icon="faServer" :to="`/host/${vm.affinityHost}`" size="small">
          {{ affinityHostName }}
        </UiLink>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('protect-from-accidental-deletion')">
      <template #value>
        <VtsEnabledState :enabled="vm.blockedOperations.destroy !== undefined" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('protect-from-accidental-shutdown')">
      <template #value>
        <VtsEnabledState :enabled="isProtectedFromAccidentalShutdown" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('auto-power')">
      <template #value>
        <VtsEnabledState :enabled="vm.auto_poweron" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('start-delay')" :value="$t('relative-time.second', vm.startDelay)" />
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import VtsEnabledState from '@core/enabled-state/VtsEnabledState.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XoVm }>()

const { get: getHostById } = useHostStore().subscribe()

const affinityHostName = computed(() => (vm.affinityHost ? getHostById(vm.affinityHost)?.name_label : ''))
const isProtectedFromAccidentalShutdown = computed(
  () =>
    vm.blockedOperations.clean_reboot !== undefined ||
    vm.blockedOperations.clean_shutdown !== undefined ||
    vm.blockedOperations.hard_reboot !== undefined ||
    vm.blockedOperations.hard_shutdown !== undefined ||
    vm.blockedOperations.pause !== undefined ||
    vm.blockedOperations.suspend !== undefined ||
    vm.blockedOperations.shutdown !== undefined
)
</script>
