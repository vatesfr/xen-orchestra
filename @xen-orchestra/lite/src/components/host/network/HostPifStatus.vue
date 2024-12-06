<template>
  <UiInfo class="pif-status text-ellipsis" :accent="getStatusProps(status).accent">
    <p class="text-ellipsis" :class="{ card }">{{ getStatusProps(status).text }}</p>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifStatus, card } = defineProps<{
  pifStatus: any
  card?: boolean
}>()

const { t } = useI18n()

type Status = 'connected' | 'disconnected' | 'partial'
type Accent = 'success' | 'warning' | 'danger'

const states = computed<Record<Status, { text: string; icon: IconDefinition; accent: Accent }>>(() => ({
  connected: { text: t('connected'), icon: faCheck, accent: 'success' },
  disconnected: { text: t('disconnected'), icon: faCheck, accent: 'danger' },
  partial: { text: t('disconnected-from-physical-device'), icon: faExclamation, accent: 'warning' },
}))

const status = computed(() => {
  if (pifStatus) {
    return 'connected'
  }
  return 'disconnected'
})

const getStatusProps = (status: Status) => states.value[status]
</script>

<style scoped lang="postcss">
p:not(.card) {
  font-size: 1.4rem !important;
}
</style>
