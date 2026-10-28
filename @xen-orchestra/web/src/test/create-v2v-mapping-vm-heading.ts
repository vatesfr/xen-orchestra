import type { V2vMappingVmHeading } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'

// The labels are the component input: a header test reads them back as given
export function createV2vMappingVmHeading(overrides: Partial<V2vMappingVmHeading> = {}): V2vMappingVmHeading {
  return {
    locationParts: ['vcenter-prod.lab.local', 'DC-Paris', 'ds-prod-01'],
    name: 'app-03',
    statusTag: { label: 'Not migrated', accent: 'neutral' },
    ...overrides,
  }
}
