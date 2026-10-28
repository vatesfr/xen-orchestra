import { resolveV2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'

const CONNECTED = { hasConnection: true, hasDestination: false, hasVms: false }

const WITH_EMPTY_LIST = { hasConnection: true, hasDestination: true, hasVms: false }

const WITH_VMS = { hasConnection: true, hasDestination: true, hasVms: true }

describe('resolveV2vWizardStep', () => {
  it('opens the requested step once connected to a source', () => {
    expect(resolveV2vWizardStep('destination', CONNECTED)).toBe('destination')
  })

  it('stays on the source step until connected', () => {
    expect(resolveV2vWizardStep('destination', { hasConnection: false, hasDestination: true, hasVms: true })).toBe(
      'source'
    )
  })

  it.each([undefined, '', 'unknown', 42])('falls back to the source step for an unknown step (%j)', requested => {
    expect(resolveV2vWizardStep(requested, WITH_VMS)).toBe('source')
  })

  it.each(['vms', 'mapping', 'review'])('stays on the destination step until it is saved (%s)', requested => {
    expect(resolveV2vWizardStep(requested, CONNECTED)).toBe('destination')
  })

  it.each(['vms', 'mapping', 'review'])('opens %s once the list holds VMs', requested => {
    expect(resolveV2vWizardStep(requested, WITH_VMS)).toBe(requested)
  })

  it('opens the VMs step once the destination is saved, before any VM is added', () => {
    expect(resolveV2vWizardStep('vms', WITH_EMPTY_LIST)).toBe('vms')
  })

  it.each(['mapping', 'review'])('stays on the VMs step until the list holds VMs (%s)', requested => {
    expect(resolveV2vWizardStep(requested, WITH_EMPTY_LIST)).toBe('vms')
  })

  it('opens the source step even with a saved destination', () => {
    expect(resolveV2vWizardStep('source', WITH_VMS)).toBe('source')
  })
})
