<template>
  <MenuItem :busy="isCreatingBondedNetwork" accent="neutral" icon="fa:plus" @click="openNewBondedNetworkDrawer()">
    {{ t('action:create-bonded-network') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useNewBondedNetwork } from '@/modules/network/composables/use-new-bonded-network.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { openNewBondedNetworkDrawer, isCreatingBondedNetwork } = useNewBondedNetwork(() => pool)
</script>
