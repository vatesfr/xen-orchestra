<template>
  <UiCard>
    <UiTitle>
      {{ $t('graphics-display') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('vga')">
      <template #value>
        <VtsEnabledState :enabled="vm.platform.vga === 'std'" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('video-ram')">
      <template v-if="videoRamValue?.value" #value>
        {{ `${videoRamValue.value} ${videoRamValue.prefix || $t('bytes.mi')}` }}
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const videoRamValue = computed(() => (vm.platform.videoram ? formatSizeRaw(Number(vm.platform.videoram), 0) : null))
</script>
