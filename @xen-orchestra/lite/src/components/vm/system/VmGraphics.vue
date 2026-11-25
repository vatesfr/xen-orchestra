<template>
  <UiCard>
    <UiTitle>
      {{ t('graphics-display') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('vga')">
        <template #value>
          <VtsStatus :status="vm.platform.vga === 'std'" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('video-ram')">
        <template v-if="videoRam" #value>
          {{ `${videoRam} ${t('bytes:mi')}` }}
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { getVmDomainType } from '@/modules/vm/utils/vm.util.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { t } = useI18n()

const videoRam = computed(() => (getVmDomainType(vm) === 'hvm' ? Number(vm.platform.videoram ?? 4) : undefined))
</script>
