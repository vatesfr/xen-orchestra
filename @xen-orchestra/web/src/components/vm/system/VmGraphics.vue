<template>
  <UiCard class="vm-graphics">
    <UiTitle>
      {{ $t('graphics-display') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('vga')">
      <template #value>
        <VtsEnabledState :enabled="vm.vga === 'std'" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('video-ram')">
      <template v-if="videoRamValue?.value" #value>
        {{ videoRamValue.value + ' ' + (videoRamValue.prefix !== '' ? videoRamValue.prefix : $t('bytes.mi')) }}
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import VtsEnabledState from '@core/enabled-state/VtsEnabledState.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XoVm }>()

const videoRamValue = computed(() => (vm.videoram ? formatSizeRaw(Number(vm.videoram), 0) : null))
</script>
