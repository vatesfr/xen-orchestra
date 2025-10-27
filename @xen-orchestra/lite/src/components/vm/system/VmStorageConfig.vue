<template>
  <UiCard>
    <UiTitle>
      {{ t('storage-configuration') }}
    </UiTitle>
    <UiLabelValue :label="t('suspend-storage-repository')" :value="srRepo?.uuid ?? t('none')" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useSrStore } from '@/stores/xen-api/sr.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { t } = useI18n()

const { getByOpaqueRef } = useSrStore().subscribe()

const srRepo = computed(() => getByOpaqueRef(vm.suspend_SR))
</script>
