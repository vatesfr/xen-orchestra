<template>
  <MenuItem v-if="showChangeStateButton" icon="action:change-state" class="change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <HostPowerStateActions :host />
    </template>
  </MenuItem>
  <HostForgetButton :host />
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-opaque-ref="host.$ref" />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XenApiHost
  showChangeStateButton?: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.change-state {
  color: var(--color-brand-txt-base);
}
</style>
