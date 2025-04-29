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
      <template v-if="vm.affinityHost" #value>
        <UiLink :icon="faServer" :to="`host/${vm.affinityHost}`" size="small" target="_self">
          {{ vm.affinityHost }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Protect-from-accidental-deletion')">
      <template #value>
        <UiInfo :accent="vm.blockedOperations.destroy ? 'success' : 'muted'">
          {{ vm.blockedOperations.destroy ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Protect-from-accidental-shutdown')">
      <template #value>
        <UiInfo :accent="vm.blockedOperations.suspend ? 'success' : 'muted'">
          {{ vm.blockedOperations.suspend ? $t('enabled') : $t('disabled') }}
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
    <VtsQuickInfoRow :label="$t('Start-delay')">
      {{ timeAgo }}
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo } from '@vueuse/core'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XoVm }>()
const timeAgo = computed(() => useTimeAgo(vm.startDelay))
</script>
