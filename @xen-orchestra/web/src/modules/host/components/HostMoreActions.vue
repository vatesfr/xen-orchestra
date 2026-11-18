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
  <slot name="leading-actions" />
  <HostRestartToolstackButton :host />
  <template v-if="displayDisableButton">
    <HostDisableButton :host />
    <HostDisableAndEvacuateVmsButton :host />
  </template>
  <HostEnableButton v-else :host />
  <HostDetachButton :host />
  <HostForgetButton :host />
  <VtsDivider v-if="layout !== 'sections'" type="stretch" />
  <HostDownloadButton :host-id="host.id" />
</template>

<script lang="ts" setup>
import HostDetachButton from '@/modules/host/components/actions/detach/HostDetachButton.vue'
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDisableAndEvacuateVmsButton from '@/modules/host/components/actions/disable-and-evacuate-vms/HostDisableAndEvacuateVmsButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import HostRestartToolstackButton from '@/modules/host/components/actions/restart-toolstack/HostRestartToolstackButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { HostQuickAction } from '@/modules/host/utils/xo-host.util.ts'
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
  host: FrontXoHost
  layout?: 'actions-only' | 'change-state-submenu' | 'sections'
  exclude?: Partial<Record<HostQuickAction, boolean>>
}>()

defineSlots<{
  'leading-actions'?(): any
}>()

const { t } = useI18n()

const isHostHalted = computed(() => host.power_state === HOST_POWER_STATE.HALTED)

const displayDisableButton = computed(() => host.enabled || isHostHalted.value)
</script>
