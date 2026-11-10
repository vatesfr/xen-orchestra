export const V2V_WIZARD_STEPS = ['source', 'destination', 'vms', 'mapping', 'review'] as const

export type V2vWizardStep = (typeof V2V_WIZARD_STEPS)[number]

function isV2vWizardStep(value: unknown): value is V2vWizardStep {
  return (V2V_WIZARD_STEPS as readonly unknown[]).includes(value)
}

// Nothing can be read from the source without a connection, so the wizard always starts on the source step.
// The later steps fill a migration list, which only exists once its destination is saved
export function resolveV2vWizardStep(
  requested: unknown,
  { hasConnection, hasDestination }: { hasConnection: boolean; hasDestination: boolean }
): V2vWizardStep {
  if (!hasConnection || !isV2vWizardStep(requested)) {
    return 'source'
  }

  const needsDestination = requested !== 'source' && requested !== 'destination'

  if (needsDestination && !hasDestination) {
    return 'destination'
  }

  return requested
}
