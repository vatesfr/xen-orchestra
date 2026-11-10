import { resolveV2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'

const CONNECTED = { hasConnection: true, hasDestination: false }

const WITH_DESTINATION = { hasConnection: true, hasDestination: true }

describe('resolveV2vWizardStep', () => {
  it('opens the requested step once connected to a source', () => {
    expect(resolveV2vWizardStep('destination', CONNECTED)).toBe('destination')
  })

  it('stays on the source step until connected', () => {
    expect(resolveV2vWizardStep('destination', { hasConnection: false, hasDestination: true })).toBe('source')
  })

  it.each([undefined, '', 'unknown', 42])('falls back to the source step for an unknown step (%j)', requested => {
    expect(resolveV2vWizardStep(requested, WITH_DESTINATION)).toBe('source')
  })

  it.each(['vms', 'mapping', 'review'])('stays on the destination step until it is saved (%s)', requested => {
    expect(resolveV2vWizardStep(requested, CONNECTED)).toBe('destination')
  })

  it.each(['vms', 'mapping', 'review'])('opens %s once the destination is saved', requested => {
    expect(resolveV2vWizardStep(requested, WITH_DESTINATION)).toBe(requested)
  })

  it('opens the source step even with a saved destination', () => {
    expect(resolveV2vWizardStep('source', WITH_DESTINATION)).toBe('source')
  })
})
