<template>
  <VtsSpaceCard
    :used="sr.physical_utilisation"
    :total="sr.physical_size"
    :label="sr.name_label"
    :total-size-label="t('total-space')"
  />
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types'
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  sr: XenApiSr
}>()

const { t } = useI18n()
</script>
