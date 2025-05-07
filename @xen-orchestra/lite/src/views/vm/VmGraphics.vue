<template>
  <UiCard class="vm-graphics">
    <UiTitle>
      {{ $t('graphics-display') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('vga')">
      <template #value>
        <UiInfo :accent="vga === 'std' ? 'muted' : 'success'">
          {{ vga === 'std' ? $t('disabled') : $t('enabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('video-ram')">
      <template v-if="VideoRamValue" #value>
        {{ `${VideoRamValue} ${$t('bytes.mi')}` }}
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'

const { vm } = defineProps<{ vm: XenApiVm | undefined }>()

const VideoRamValue = formatSizeRaw(Number(vm?.platform.videoram ?? 4), 0)?.value

const vga = vm?.platform.vga ?? 'cirrus'
</script>
