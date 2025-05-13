<template>
  <UiCard class="vm-management">
    <UiTitle>
      {{ $t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template #value>
        <UiInfo :accent="vm.high_availability !== '' ? 'success' : 'muted'">
          {{ vm.high_availability ? $t(vm.high_availability) : $t('disabled') }}
        </UiInfo>
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
        <UiInfo :accent="vm.blockedOperations.destroy ? 'success' : 'muted'">
          {{ vm.blockedOperations.destroy ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('protect-from-accidental-shutdown')">
      <template #value>
        <UiInfo :accent="isProtectedFromAccidentalShutdown ? 'success' : 'muted'">
          {{ isProtectedFromAccidentalShutdown ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('auto-power')">
      <template #value>
        <UiInfo :accent="vm.auto_poweron ? 'success' : 'muted'">
          {{ vm.auto_poweron ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('start-delay')">
      <template #value>
        {{ $t('relative-time.second', vm.startDelay) }}
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XoVm }>()

const { get: getHostById } = useHostStore().subscribe()

const affinityHostName = computed(() => (vm.affinityHost ? getHostById(vm.affinityHost)?.name_label : ''))
const isProtectedFromAccidentalShutdown = computed(
  () =>
    vm.blockedOperations.clean_reboot ||
    vm.blockedOperations.clean_shutdown ||
    vm.blockedOperations.hard_reboot ||
    vm.blockedOperations.hard_shutdown ||
    vm.blockedOperations.pause ||
    vm.blockedOperations.suspend ||
    vm.blockedOperations.shutdown
)
</script>
