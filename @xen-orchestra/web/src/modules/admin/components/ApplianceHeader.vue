<template>
  <UiHeadBar icon="fa:satellite">
    {{ XOA_NAME }}
    <template #actions>
      <ApplianceCheckUpdatesButton />
      <VtsActionsMenu :label="t('more-actions')" size="medium">
        <ApplianceRestartXoServerButton />
      </VtsActionsMenu>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import ApplianceCheckUpdatesButton from '@/modules/appliance/components/actions/check-updates/ApplianceCheckUpdatesButton.vue'
import ApplianceRestartXoServerButton from '@/modules/appliance/components/actions/restart-xo-server/ApplianceRestartXoServerButton.vue'
import { XOA_NAME } from '@/shared/constants.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
