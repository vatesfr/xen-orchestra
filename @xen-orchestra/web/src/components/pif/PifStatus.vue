<template>
  <UiInfo class="pif-status text-ellipsis" :accent="getStatusProps(status).accent">
    <p class="text-ellipsis">{{ getStatusProps(status).text }}</p>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  pif: any
  card?: boolean
}>()

const { t } = useI18n()

type NetworkStatus = 'connected' | 'disconnected' | 'partial'
type NetworkAccent = 'success' | 'warning' | 'danger'

const states = computed<Record<NetworkStatus, { text: string; icon: IconDefinition; accent: NetworkAccent }>>(() => ({
  connected: { text: t('connected'), icon: faCheck, accent: 'success' },
  disconnected: { text: t('disconnected'), icon: faCheck, accent: 'danger' },
  partial: { text: t('disconnected-from-physical-device'), icon: faExclamation, accent: 'warning' },
}))

const status = computed(() => {
  if (props.pif.attached && props.pif.carrier) {
    return 'connected'
  }
  if (props.pif.attached && !props.pif.carrier) {
    return 'partial'
  }
  return 'disconnected'
})

const getStatusProps = (status: NetworkStatus) => states.value[status as NetworkStatus]
</script>

<style scoped lang="postcss">
.pif-status p {
  font-size: 1.4rem !important;
}
</style>
