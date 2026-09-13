<template>
  <MenuItem accent="brand" icon="action:change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <HostPowerStateActions :host />
    </template>
  </MenuItem>
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-opaque-ref="host.$ref" />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()
</script>
