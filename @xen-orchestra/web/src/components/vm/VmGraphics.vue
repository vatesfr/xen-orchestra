<template>
  <UiPanel class="vm-graphics">
    <UiTitle>
      {{ $t('Graphics-Display') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('graphics.VGA')">
      <template #value>
        <UiInfo :accent="vm.vga == 'std' ? 'muted' : 'success'">
          {{ vm.vga == 'std' ? $t('disabled') : $t('enabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Video-RAM')">
      <template #value>
        {{ vm.videoram.toString() + $t('bytes.mi') }}
      </template>
    </VtsQuickInfoRow>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>

<style lang="postcss" scoped>
.vm-graphics {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
