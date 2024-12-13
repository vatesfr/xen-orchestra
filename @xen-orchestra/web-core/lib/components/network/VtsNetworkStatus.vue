<template>
  <UiInfo class="status-indicator text-ellipsis" :accent="computedStatusProps.accent">
    <p v-tooltip class="text-ellipsis" :class="{ card }">{{ computedStatusProps.text }}</p>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  items?: any | any[]
  card?: boolean
}>()

const { t } = useI18n()

type Status = 'connected' | 'disconnected' | 'partially_connected'
type StatusAccent = 'success' | 'warning' | 'danger'

const defaultStatusLogic = (items: any[]): string => {
  if (items.every(item => ('currentlyAttached' in item ? item.currentlyAttached : item.carrier && item.attached))) {
    return 'connected'
  }
  if (items.some(item => ('currentlyAttached' in item ? item.currentlyAttached : item.carrier || item.attached))) {
    return 'partially_connected'
  }
  return 'disconnected'
}

const states: Record<Status, { text: string; icon?: IconDefinition; accent: StatusAccent }> = {
  connected: { text: t('connected'), icon: faCheck, accent: 'success' },
  disconnected: { text: t('disconnected'), icon: faCheck, accent: 'danger' },
  partially_connected: { text: t('partially-connected'), icon: faExclamation, accent: 'warning' },
}

const items = computed(() => (Array.isArray(props.items) ? props.items : props.items ? [props.items] : []))

const status = computed(() => {
  return defaultStatusLogic(items.value)
})

const computedStatusProps = computed(() => states[status.value as Status])
</script>

<style scoped lang="postcss">
p:not(.card) {
  font-size: 1.4rem !important;
}
</style>
