<template>
  <UiDrawer class="register-appliance-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:register-appliance') }}</template>

    <template #content>
      <div class="alerts">
        <UiAlert v-if="wrongCredentials" accent="danger">
          <span class="typo-body-bold">{{ t('appliance:registration-wrong-credentials') }}</span>
          <template #description>{{ t('appliance:registration-wrong-credentials-description') }}</template>
        </UiAlert>
        <UiAlert accent="info">
          <span class="typo-body-bold">{{ t('appliance:registration-required') }}</span>
          <template #description>{{ t('appliance:registration-required-description') }}</template>
        </UiAlert>
      </div>
      <VtsRequiredHint class="required-hint" />
      <RegisterApplianceForm ref="form" />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:register') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import RegisterApplianceForm from '@/modules/appliance/components/form/register/RegisterApplianceForm.vue'
import type { RegisterAppliancePayload } from '@/modules/appliance/jobs/xoa-register.job.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  wrongCredentials: boolean
}>()

const emit = defineEmits<{
  confirm: [payload: RegisterAppliancePayload]
  cancel: []
}>()

const { t } = useI18n()

const form = useTemplateRef('form')

async function handleConfirm() {
  const payload = await form.value?.validate()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.register-appliance-drawer {
  .alerts {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .required-hint {
    margin-block: 2.4rem;
  }
}
</style>
