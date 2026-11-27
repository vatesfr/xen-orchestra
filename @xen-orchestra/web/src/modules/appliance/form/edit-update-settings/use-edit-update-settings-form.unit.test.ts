import { useEditUpdateSettingsForm } from '@/modules/appliance/form/edit-update-settings/use-edit-update-settings-form.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

function mountEditUpdateSettingsForm(channel?: string, dailyCheck?: boolean) {
  return mountComposableWithI18n(() => useEditUpdateSettingsForm(channel, dailyCheck))
}

describe('initial values', () => {
  it.each(['latest', 'stable'])('selects the %s channel', channel => {
    const form = mountEditUpdateSettingsForm(channel)

    expect(form.channelChoiceRadioBindings.modelValue).toBe(channel)
    expect(form.isCustomChannel).toBe(false)
    expect(form.customChannelInputBindings.modelValue).toBe('')
  })

  it('selects a custom channel with its name', () => {
    const form = mountEditUpdateSettingsForm('beta-2026')

    expect(form.channelChoiceRadioBindings.modelValue).toBe('custom')
    expect(form.isCustomChannel).toBe(true)
    expect(form.customChannelInputBindings.modelValue).toBe('beta-2026')
  })

  it('selects no channel while it is unknown', () => {
    const form = mountEditUpdateSettingsForm(undefined)

    expect(form.channelChoiceRadioBindings.modelValue).toBeUndefined()
    expect(form.isCustomChannel).toBe(false)
  })

  it('keeps the daily check, disabled when unknown', () => {
    expect(mountEditUpdateSettingsForm('stable', true).dailyCheckCheckboxBindings.modelValue).toBe(true)
    expect(mountEditUpdateSettingsForm('stable', undefined).dailyCheckCheckboxBindings.modelValue).toBe(false)
  })
})

describe('validateAndBuildPayload', () => {
  it('builds the payload with the chosen channel', async () => {
    const form = mountEditUpdateSettingsForm('stable', false)
    form.channelChoiceRadioBindings['onUpdate:modelValue']('latest')
    form.dailyCheckCheckboxBindings['onUpdate:modelValue'](true)

    expect(await form.validateAndBuildPayload()).toEqual({ channel: 'latest', dailyCheck: true })
  })

  it('builds the payload with the name of a custom channel', async () => {
    const form = mountEditUpdateSettingsForm('stable')
    form.channelChoiceRadioBindings['onUpdate:modelValue']('custom')
    form.customChannelInputBindings['onUpdate:modelValue']('beta-2026')

    expect(await form.validateAndBuildPayload()).toEqual({ channel: 'beta-2026', dailyCheck: false })
  })

  it('ignores the custom channel name once another channel is chosen', async () => {
    const form = mountEditUpdateSettingsForm('beta-2026')
    form.channelChoiceRadioBindings['onUpdate:modelValue']('stable')

    expect(await form.validateAndBuildPayload()).toEqual({ channel: 'stable', dailyCheck: false })
  })

  it('builds no payload without channel, and reports it', async () => {
    const form = mountEditUpdateSettingsForm(undefined)

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.channelChoiceRadioBindings.error).toEqual(dangerMessage(form.t('appliance:release-channel-required')))
  })

  it('builds no payload with a custom channel without name, and reports it', async () => {
    const form = mountEditUpdateSettingsForm('stable')
    form.channelChoiceRadioBindings['onUpdate:modelValue']('custom')

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.customChannelInputBindings.error).toEqual(dangerMessage(form.t('appliance:channel-name-required')))
  })
})
