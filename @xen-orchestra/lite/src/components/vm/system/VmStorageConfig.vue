<template>
  <UiCard>
    <UiTitle>
      {{ $t('storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('suspend-storage-repository')" :value="srRepo?.uuid ?? $t('none')" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useSrStore } from '@/stores/xen-api/sr.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { getByOpaqueRef } = useSrStore().subscribe()

const srRepo = computed(() => getByOpaqueRef(vm.suspend_SR))
</script>
