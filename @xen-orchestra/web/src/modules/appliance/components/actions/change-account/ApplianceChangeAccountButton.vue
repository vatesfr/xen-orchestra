<template>
  <UiButton
    :busy="isRegistering"
    accent="brand"
    left-icon="action:edit"
    size="small"
    variant="tertiary"
    @click="openRegisterApplianceDrawer()"
  >
    {{ t('action:change-account') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useRegisterAppliance } from '@/modules/appliance/composables/use-register-appliance.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openRegisterApplianceDrawer, isRegistering } = useRegisterAppliance({ renew: true })
</script>
