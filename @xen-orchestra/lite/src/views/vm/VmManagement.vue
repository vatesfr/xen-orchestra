<template>
  <UiCard class="vm-management">
    <UiTitle>
      {{ $t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template #value>
        <!--
 <UiInfo :accent="vm.high_availability !== '' ? 'success' : 'muted'">
          {{ vm.high_availability ? $t(vm.high_availability) : $t('disabled') }}
        </UiInfo>
-->
        {{ $t('add') }}
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('affinity-host')">
      <template #value>
        <UiLink :icon="faServer" :to="`host/${'hello'}`" size="small" target="_self"> {{ $t('add') }} </UiLink>
      </template>
      <VtsQuickInfoRow :label="$t('Protect-from-accidental-deletion')">
        <template #value>
          <UiInfo accent="danger">{{ $t('no-data') }}</UiInfo>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('Protect-from-accidental-shutdown')">
        <template #value>
          <UiInfo accent="danger">{{ $t('no-data') }}</UiInfo>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('auto-power')">
        <template #value>
          <UiInfo :accent="true ? 'success' : 'muted'">
            {{ true ? $t('enabled') : $t('disabled') }}
          </UiInfo>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('Start-delay')">
        {{ timeAgo }}
      </VtsQuickInfoRow>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo } from '@vueuse/core'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm | undefined }>()

const timeAgo = computed(() => useTimeAgo(vm?.start_delay ?? NaN))

// not found
// high_availability
// auto_poweron
</script>
