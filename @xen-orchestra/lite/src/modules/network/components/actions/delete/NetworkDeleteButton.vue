<template>
  <MenuItem icon="action:delete" :busy="isDeletingNetworks" accent="danger" @click="deleteNetworks()">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkDelete } from '@/modules/network/composables/use-network-delete.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: XenApiNetwork
}>()

const { t } = useI18n()

const { deleteNetworks, isDeletingNetworks } = useNetworkDelete(() => [network])
</script>
