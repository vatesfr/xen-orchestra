<template>
  <UiCard class="vm-management">
    <UiTitle>
      {{ $t('vm-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('High-availability')">
      <template #value>
        <UiInfo :accent="vm.high_availability !== '' ? 'success' : 'muted'">
          {{ vm.high_availability ? $t(vm.high_availability) : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('affinity-host')">
      <template #value>
        <template v-if="vm.affinityHost">
          <UiLink :icon="faServer" :href="`#/host/${vm.affinityHost}`" size="small" target="_self">
            {{ vm.affinityHost }}
          </UiLink>
        </template>
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
          <UiInfo :accent="vm.auto_poweron ? 'success' : 'muted'">
            {{ vm.auto_poweron ? $t('enabled') : $t('disabled') }}
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

<style lang="postcss" scoped>
.vm-management {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
