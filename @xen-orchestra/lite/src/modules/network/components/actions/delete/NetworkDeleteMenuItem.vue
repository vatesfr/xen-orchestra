<template>
  <MenuItem
    v-tooltip="!canDeleteNetworks && deleteNetworksErrorMessage"
    icon="action:delete"
    :disabled="!canDeleteNetworks"
    :busy="isDeletingNetworks"
    class="delete"
    @click="deleteNetworks()"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkDelete } from '@/modules/network/composables/use-network-delete.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: XenApiNetwork
}>()

const { t } = useI18n()

const { deleteNetworks, canDeleteNetworks, isDeletingNetworks, deleteNetworksErrorMessage } = useNetworkDelete(() => [
  network,
])
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
