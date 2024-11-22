<template>
  <div class="pif-status">
    <VtsIcon
      v-if="icon"
      :accent="getStatusProps(status).accent"
      :icon="faCircle"
      :overlay-icon="getStatusProps(status).icon"
    />
    <p class="text-ellipsis" :class="{ 'typo p3-regular': card }">
      {{ getStatusProps(status).text }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { XoPif } from '@/types/xo/pif.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheck, faCircle, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  icon?: IconDefinition
  pif: XoPif
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
.pif-status {
  display: flex;
  gap: 1rem;
  align-items: center;
}
</style>
