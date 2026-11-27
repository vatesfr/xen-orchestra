<template>
  <UiRichRadioButtonGroup :accent :message="errorMessage" vertical>
    <template #label>
      <div class="label">
        <UiLabel :accent="labelAccent" required>{{ label }}</UiLabel>
        <span class="description typo-body-regular-small">{{ description }}</span>
      </div>
    </template>
    <UiRichRadioButton
      v-for="option of options"
      :key="option.value"
      v-model="model"
      :description="option.description"
      :value="option.value"
      :accent
    >
      {{ option.label }}
    </UiRichRadioButton>
  </UiRichRadioButtonGroup>
</template>

<script lang="ts" setup>
import type { UpdateChannelChoice } from '@/modules/appliance/form/edit-update-settings/use-edit-update-settings-form.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import UiRichRadioButtonGroup from '@core/components/ui/rich-radio-button-group/UiRichRadioButtonGroup.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  label: string
  description: string
  error?: InputWrapperMessage
}>()

const model = defineModel<UpdateChannelChoice | undefined>({ required: true })

const { t } = useI18n()

const errorMessage = computed(() => {
  const [message] = toArray(error)

  if (message === undefined) {
    return undefined
  }

  if (typeof message === 'object') {
    return message.content
  }

  return message
})

const accent = computed(() => {
  if (errorMessage.value === undefined) {
    return 'brand'
  }

  return 'danger'
})

const labelAccent = computed(() => {
  if (errorMessage.value === undefined) {
    return 'neutral'
  }

  return 'danger'
})

const options = computed<{ label: string; description: string; value: UpdateChannelChoice }[]>(() => [
  { label: t('appliance:channel-latest'), description: t('appliance:channel-latest-description'), value: 'latest' },
  { label: t('appliance:channel-stable'), description: t('appliance:channel-stable-description'), value: 'stable' },
  { label: t('appliance:channel-custom'), description: t('appliance:channel-custom-description'), value: 'custom' },
])
</script>

<style lang="postcss" scoped>
.label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .description {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
