<template>
  <UiLink
    :to="to ?? { name: '/host/[uuid]/dashboard', params: { uuid: host.uuid } }"
    :size
    :icon
    :is-primary="isMaster"
    :primary-tooltip="t('master')"
  >
    <slot>{{ host.name_label }}</slot>
  </UiLink>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostIcon } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host, to } = defineProps<{
  host: XenApiHost
  size: 'small' | 'medium'
  to?: LinkOptions['to']
}>()

const { t } = useI18n()

const { isMasterHost } = usePoolStore().subscribe()
const { getHostPowerState } = useHostMetricsStore().subscribe()

const icon = computed(() => getHostIcon(host, getHostPowerState(host)))

const isMaster = computed(() => isMasterHost(host.$ref))
</script>
