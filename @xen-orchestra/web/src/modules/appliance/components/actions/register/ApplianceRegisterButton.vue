<template>
  <UiButton
    :busy="isRegistering"
    accent="brand"
    left-icon="fa:circle-user"
    size="small"
    variant="secondary"
    @click="openRegisterApplianceDrawer()"
  >
    {{ t('action:register-with-my-account') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useRegisterAppliance } from '@/modules/appliance/composables/use-register-appliance.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openRegisterApplianceDrawer, isRegistering } = useRegisterAppliance()
</script>
