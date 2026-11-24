<template>
  <UiButton
    :busy="isCreatingInternalNetwork"
    accent="brand"
    left-icon="fa:plus"
    size="medium"
    variant="tertiary"
    @click="openNewInternalNetworkDrawer()"
  >
    {{ t('new') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useNewInternalNetwork } from '@/modules/network/composables/use-new-internal-network.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { openNewInternalNetworkDrawer, isCreatingInternalNetwork } = useNewInternalNetwork(() => pool)
</script>
