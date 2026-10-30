import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { V2vAccentedLabel } from '@/modules/v2v/types/v2v-accented-label.type.ts'
import type { V2vUnsupportedReason } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { V2V_READINESS_LEVELS } from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import type { XoV2vVm } from '@vates/types'
import type { RouteLocationRaw } from 'vue-router'

export type V2vReadinessLevel = (typeof V2V_READINESS_LEVELS)[number]

// A resumed VM goes on from its last warm sync, a new one is imported from scratch
export type V2vSelectedVmKind = 'new' | 'resume'

export type V2vUnsupportedCheck = { type: 'unsupported'; level: 'blocking'; reason: V2vUnsupportedReason }

export type V2vSelectedVmCheck =
  | { type: 'not-found'; level: 'blocking' }
  | V2vUnsupportedCheck
  | { type: 'running'; level: 'blocking' }
  | { type: 'partial-on-other-pool'; level: 'blocking'; poolId: FrontXoPool['id'] }
  | { type: 'mapping-incomplete'; level: 'blocking' }
  | { type: 'already-migrated'; level: 'warning' }
  | { type: 'ready'; level: 'ready' }

// The checks of the source VM itself, one per subject, each telling it ready or not
export type V2vVmCheck =
  | V2vUnsupportedCheck
  | { type: 'no-unsupported-disk'; level: 'ready' }
  | { type: 'snapshots'; level: 'warning'; count: number }
  | { type: 'no-snapshot'; level: 'ready' }

export type V2vSelectedVmState = {
  kind: V2vSelectedVmKind
  check: V2vSelectedVmCheck
}

// The distinct names of the targets, `undefined` while one of them loads
export type V2vMappingSummary =
  | { type: 'locked' }
  | { type: 'mapped'; diskCount: number; srNames?: string[]; nicCount: number; networkNames?: string[] }

export type V2vSelectedVm = {
  id: XoV2vVm['id']
  name: string
  kind?: V2vAccentedLabel<TagAccent>
  mappingParts: string[]
  check: V2vAccentedLabel<InfoAccent>
  mappingRoute: RouteLocationRaw
  isSelected: boolean
}

// A VM of the list, as the mapping step tells it apart, with its item of the panel
export type V2vListedVm = {
  kind: V2vSelectedVmKind
  check: V2vSelectedVmCheck
  mapping: V2vMappingSummary | undefined
  item: V2vSelectedVm
}

export type V2vListPair = {
  sourceHost?: string
  poolName?: string
}
