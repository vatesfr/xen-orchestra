<template>
  <MenuItem v-if="showChangeState" icon="action:change-state" class="change-state typo-body-bold-small">
    {{ t('action:change-state') }}
    <template #submenu>
      <HostPowerStateAction :host />
    </template>
  </MenuItem>
  <HostEnableButton v-if="!host.enabled && !hostIsHalted" :host />
  <HostDisableButton v-else :host />
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-id="host.id" />
</template>

<script lang="ts" setup>
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostPowerStateAction from '@/modules/host/components/actions/HostPowerStateAction.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
  showChangeState?: boolean
}>()

const { t } = useI18n()

const hostIsHalted = computed(() => host.power_state === HOST_POWER_STATE.HALTED)
</script>

<style lang="postcss" scoped>
.change-state {
  color: var(--color-brand-txt-base);
}
</style>
