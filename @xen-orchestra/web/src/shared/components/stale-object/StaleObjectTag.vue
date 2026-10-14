<template>
  <UiTag
    v-if="isStale"
    v-tooltip="t('pool-disconnected-last-seen', { time: lastSeenLabel })"
    accent="warning"
    variant="secondary"
  >
    {{ t('disconnected') }}
  </UiTag>
</template>

<script lang="ts" setup>
import { useStaleObject } from '@/shared/composables/stale-object.composable.ts'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { object } = defineProps<{
  object: { $lastSeen?: number }
}>()

const { t } = useI18n()

const { isStale, lastSeenLabel } = useStaleObject(() => object)
</script>
