<template>
  <MenuItem v-if="showChangeStateButton" icon="action:change-state" class="change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <HostPowerStateActions :host />
    </template>
  </MenuItem>
  <HostDisableButton v-if="displayDisableButton" :host />
  <HostEnableButton v-else :host />
  <HostForgetButton :host />
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-opaque-ref="host.$ref" />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
  showChangeStateButton?: boolean
}>()

const { t } = useI18n()

const { isHostHalted } = useHostMetricsStore().subscribe()

const displayDisableButton = computed(() => host.enabled || isHostHalted(host))
</script>

<style lang="postcss" scoped>
.change-state {
  color: var(--color-brand-txt-base);
}
</style>
