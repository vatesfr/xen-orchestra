import { resolveV2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'

describe('resolveV2vWizardStep', () => {
  it('opens the requested step once connected to a source', () => {
    expect(resolveV2vWizardStep('destination', { hasConnection: true })).toBe('destination')
  })

  it('stays on the source step until connected', () => {
    expect(resolveV2vWizardStep('destination', { hasConnection: false })).toBe('source')
  })

  it.each([undefined, '', 'unknown', 42])('falls back to the source step for an unknown step (%j)', requested => {
    expect(resolveV2vWizardStep(requested, { hasConnection: true })).toBe('source')
  })
})
