<template>
  <UiCard class="vm-graphics">
    <UiTitle>
      {{ $t('graphics-display') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('vga')">
      <template #value>
        <UiInfo :accent="vga === 'std' ? 'success' : 'muted'">
          {{ vga === 'std' ? $t('enabled') : $t('disabled') }}
        </UiInfo>
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
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const videoRamValue = computed(() => (vm.platform.videoram ? formatSizeRaw(Number(vm.platform.videoram), 0) : null))
const vga = computed(() => vm.platform.vga ?? 'cirrus')
</script>
