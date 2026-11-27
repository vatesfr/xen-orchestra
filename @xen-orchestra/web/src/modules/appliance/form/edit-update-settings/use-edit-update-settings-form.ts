import type { EditUpdateSettingsPayload } from '@/modules/appliance/jobs/xoa-update-settings-edit.job.ts'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type UpdateChannelChoice = 'latest' | 'stable' | 'custom'

export type EditUpdateSettingsFormData = {
  channelChoice: UpdateChannelChoice | undefined
  customChannel: string
  dailyCheck: boolean
}

function getInitialChannelChoice(channel: string | undefined): UpdateChannelChoice | undefined {
  if (channel === undefined) {
    return undefined
  }

  if (channel === 'latest' || channel === 'stable') {
    return channel
  }

  return 'custom'
}

function getInitialCustomChannel(channel: string | undefined): string {
  if (channel === undefined || getInitialChannelChoice(channel) !== 'custom') {
    return ''
  }

  return channel
}

export function useEditUpdateSettingsForm(channel: string | undefined, dailyCheck: boolean | undefined) {
  const { t } = useI18n()

  const formData = reactive<EditUpdateSettingsFormData>({
    channelChoice: getInitialChannelChoice(channel),
    customChannel: getInitialCustomChannel(channel),
    dailyCheck: dailyCheck ?? false,
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        channelChoice: { required: withMessage(required, () => t('appliance:release-channel-required')) },
        customChannel: {
          requiredIf: withMessage(
            requiredIf(() => formData.channelChoice === 'custom'),
            () => t('appliance:channel-name-required')
          ),
        },
      }),
    },
  })

  function buildChannel(): string {
    if (formData.channelChoice === 'custom') {
      return formData.customChannel
    }

    return formData.channelChoice!
  }

  async function validateAndBuildPayload(): Promise<EditUpdateSettingsPayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      channel: buildChannel(),
      dailyCheck: formData.dailyCheck,
    }
  }

  const isCustomChannel = computed(() => formData.channelChoice === 'custom')

  return {
    isCustomChannel,
    channelChoiceRadioBindings: useField('channelChoice', () => ({
      label: t('appliance:release-channel'),
      description: t('appliance:release-channel-description'),
    })),
    customChannelInputBindings: useField('customChannel', () => ({
      label: t('appliance:channel-name'),
      info: t('appliance:channel-name-info'),
      required: true,
    })),
    dailyCheckCheckboxBindings: useField('dailyCheck'),
    validateAndBuildPayload,
  }
}
