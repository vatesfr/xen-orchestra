<template>
  <div class="edit-update-settings-form">
    <UiTitle>{{ t('configuration') }}</UiTitle>
    <ApplianceUpdateChannelRadio v-bind="channelChoiceRadioBindings" />
    <FormTextInput v-if="isCustomChannel" v-bind="customChannelInputBindings" />
    <UiTitle class="section-title">{{ t('options') }}</UiTitle>
    <FormRichCheckbox v-bind="dailyCheckCheckboxBindings" :description="t('appliance:daily-check-description')">
      {{ t('appliance:daily-check-label') }}
    </FormRichCheckbox>
  </div>
</template>

<script lang="ts" setup>
import ApplianceUpdateChannelRadio from '@/modules/appliance/components/form/inputs/ApplianceUpdateChannelRadio.vue'
import { useEditUpdateSettingsForm } from '@/modules/appliance/form/edit-update-settings/use-edit-update-settings-form.ts'
import FormRichCheckbox from '@/shared/components/form/FormRichCheckbox.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { channel, dailyCheck } = defineProps<{
  channel?: string
  dailyCheck?: boolean
}>()

const { t } = useI18n()

const {
  isCustomChannel,
  channelChoiceRadioBindings,
  customChannelInputBindings,
  dailyCheckCheckboxBindings,
  validateAndBuildPayload,
} = useEditUpdateSettingsForm(channel, dailyCheck)

defineExpose({
  validate: validateAndBuildPayload,
})
</script>

<style lang="postcss" scoped>
.edit-update-settings-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .section-title {
    margin-block-start: 1.6rem;
  }
}
</style>
