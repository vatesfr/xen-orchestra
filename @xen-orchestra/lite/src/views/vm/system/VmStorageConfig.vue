<template>
  <UiCard class="vm-storage-config">
    <UiTitle>
      {{ $t('storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('suspend-storage-repository')" :value="srRrepo?.uuid" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useSrStore } from '@/stores/xen-api/sr.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XenApiVm | undefined }>()

const srRrepo = vm ? useSrStore().getContext().getByOpaqueRef(vm?.suspend_SR) : undefined
</script>
