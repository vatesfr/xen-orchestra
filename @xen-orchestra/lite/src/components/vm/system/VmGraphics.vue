<template>
  <UiCard>
    <UiTitle>
      {{ t('graphics-display') }}
    </UiTitle>
    <UiLabelValue :label="t('vga')">
      <template #value>
        <VtsStatus :status="vm.platform.vga === 'std'" />
      </template>
    </UiLabelValue>
    <UiLabelValue
      :label="t('video-ram')"
      :value="videoRamValue?.value ? `${videoRamValue.value} ${videoRamValue.prefix || t('bytes.mi')}` : undefined"
    />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { t } = useI18n()

const videoRamValue = computed(() => (vm.platform.videoram ? formatSizeRaw(Number(vm.platform.videoram), 0) : null))
</script>
