<template>
  <UiCard>
    <UiTitle>
      {{ t('graphics-display') }}
    </UiTitle>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('vga')">
        <template #value>
          <VtsStatus :status="vm.vga === 'std'" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('video-ram')">
        <template v-if="videoRamValue?.value" #value>
          {{ `${videoRamValue.value} ${videoRamValue.prefix || t('bytes:mi')}` }}
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()

const videoRamValue = computed(() => (vm.videoram ? formatSizeRaw(vm.videoram, 0) : null))
</script>
