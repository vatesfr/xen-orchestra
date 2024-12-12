<template>
  <UiInfo class="pif-status text-ellipsis" :accent="statusProps.accent">
    <p v-tooltip class="text-ellipsis" :class="{ card }">{{ statusProps.text }}</p>
  </UiInfo>
</template>

<script setup lang="ts">
import type { XoPif } from '@/types/xo/pif.type'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  pif?: XoPif
  pifs?: XoPif[]
  card?: boolean
}>()

const { t } = useI18n()

type NetworkStatus = 'connected' | 'disconnected' | 'partially_connected'
type NetworkAccent = 'success' | 'warning' | 'danger'

const states: Record<NetworkStatus, { text: string; icon: IconDefinition; accent: NetworkAccent }> = {
  connected: { text: t('connected'), icon: faCheck, accent: 'success' },
  disconnected: { text: t('disconnected'), icon: faCheck, accent: 'danger' },
  partially_connected: { text: t('disconnected-from-physical-device'), icon: faExclamation, accent: 'warning' },
}

const status = computed<NetworkStatus>(() => {
  const pifs = props.pifs || (props.pif ? [props.pif] : [])

  if (pifs.every(pif => pif.carrier && pif.attached)) return 'connected'
  if (pifs.some(pif => pif.carrier || pif.attached)) return 'partially_connected'
  return 'disconnected'
})

const statusProps = computed(() => states[status.value])
</script>

<style scoped lang="postcss">
p:not(.card) {
  font-size: 1.4rem !important;
}
</style>
