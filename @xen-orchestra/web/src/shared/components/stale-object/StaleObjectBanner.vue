<template>
  <VtsBanner v-if="isStale" accent="warning">
    <UiInfo accent="warning" wrap>{{ t('stale-object-banner', { time: lastSeenLabel }) }}</UiInfo>
  </VtsBanner>
</template>

<script lang="ts" setup>
import { useStaleObject } from '@/shared/composables/stale-object.composable.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const { object } = defineProps<{
  object: { $lastSeen?: number }
}>()

const { t } = useI18n()

const { isStale, lastSeenLabel } = useStaleObject(() => object)
</script>
