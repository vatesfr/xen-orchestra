<template>
  <template v-if="layout === 'sections'">
    <HostPowerStateActions :host :exclude>
      <template #title>
        <VtsMenuTitle>{{ t('action:change-state') }}</VtsMenuTitle>
      </template>
    </HostPowerStateActions>
    <VtsMenuTitle>{{ t('actions') }}</VtsMenuTitle>
  </template>
  <VtsChangeStateMenuItem v-else-if="layout === 'change-state-submenu'">
    <HostPowerStateActions :host />
  </VtsChangeStateMenuItem>
  <HostRestartToolstackButton :host />
  <HostDisableButton v-if="displayDisableButton" :host />
  <HostEnableButton v-else :host />
  <HostDetachButton :host />
  <HostForgetButton :host />
  <VtsDivider v-if="layout !== 'sections'" type="stretch" />
  <HostDownloadButton :host-opaque-ref="host.$ref" />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostDetachButton from '@/modules/host/components/actions/detach/HostDetachButton.vue'
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import HostRestartToolstackButton from '@/modules/host/components/actions/restart-toolstack/HostRestartToolstackButton.vue'
import type { HostQuickAction } from '@/modules/host/composables/host-quick-actions.composable.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import VtsMenuTitle from '@core/components/menu/VtsMenuTitle.vue'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  host,
  layout = 'actions-only',
  exclude = {},
} = defineProps<{
  host: XenApiHost
  layout?: 'actions-only' | 'change-state-submenu' | 'sections'
  exclude?: Partial<Record<HostQuickAction, boolean>>
}>()

const { t } = useI18n()

const { getHostPowerState } = useHostMetricsStore().subscribe()

const isHostHalted = computed(() => getHostPowerState(host) === HOST_POWER_STATE.HALTED)

const displayDisableButton = computed(() => host.enabled || isHostHalted.value)
</script>
