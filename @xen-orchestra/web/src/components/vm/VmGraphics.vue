<template>
  <UiCard class="vm-graphics">
    <UiTitle>
      {{ $t('graphics-display') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('vga')">
      <template #value>
        <UiInfo :accent="vm.vga === 'std' ? 'muted' : 'success'">
          {{ vm.vga === 'std' ? $t('disabled') : $t('enabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('video-ram')">
      <template v-if="VideoRamValue" #value>
        {{ VideoRamValue + $t('bytes.mi') }}
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'

const { vm } = defineProps<{ vm: XoVm }>()

const VideoRamValue = formatSizeRaw(vm.videoram, 0)?.value
</script>
