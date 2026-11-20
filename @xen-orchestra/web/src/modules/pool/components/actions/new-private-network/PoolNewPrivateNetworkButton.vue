<template>
  <UiButton
    v-tooltip="isSdnControllerMissing && t('sdn-controller-plugin-required')"
    :busy="isCreatingPrivateNetwork"
    :disabled="!canCreatePrivateNetwork"
    accent="brand"
    left-icon="fa:plus"
    size="medium"
    variant="tertiary"
    @click="openNewPrivateNetworkDrawer()"
  >
    {{ t('new') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useNewPrivateNetwork } from '@/modules/network/composables/use-new-private-network.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { openNewPrivateNetworkDrawer, isCreatingPrivateNetwork, canCreatePrivateNetwork, isSdnControllerMissing } =
  useNewPrivateNetwork(() => pool)
</script>
