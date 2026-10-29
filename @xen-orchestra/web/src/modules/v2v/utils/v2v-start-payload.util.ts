import type { V2vLaunchSettings, V2vStartProblem, V2vStartVm } from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vDestinationDefaults } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { getUnprocessableEntityData } from '@/shared/utils/api-error.util.ts'
import { hasObjectProperty } from '@core/utils/object.util.ts'
import type { XoV2vConnection, XoV2vStartPayload, XoV2vStartPayloadVm, XoV2vVm } from '@vates/types'

export type V2vStartPayloadInput = {
  connection: XoV2vConnection
  defaults: V2vDestinationDefaults
  settings: V2vLaunchSettings
  vms: V2vStartVm[]
}

// The back end refuses to start or clean up a VM, to tag it or to give it new MACs: only what it accepts is sent,
// whatever the list holds
const UNSUPPORTED_DEFAULTS = { startVm: false, cleanup: false }

const UNSUPPORTED_VM_OPTIONS = { tags: [], keepMac: true }

// A resumed VM keeps the mapping of its first sync, which the import reads from the XCP-ng VM
function buildVm({ id, kind, disks, nics, template, overrides }: V2vStartVm): XoV2vStartPayloadVm {
  const mapping = kind === 'resume' ? {} : { disks, nics, template }

  // An `undefined` key is not sent: the VM is then on the list defaults or the launch settings
  return { id, ...mapping, stopSource: overrides?.stopSource, ...UNSUPPORTED_VM_OPTIONS }
}

export function buildV2vStartPayload({ connection, defaults, settings, vms }: V2vStartPayloadInput): XoV2vStartPayload {
  const { stopSource, stopOnError, concurrency } = settings

  return {
    connection,
    defaults: { ...defaults, stopSource, ...UNSUPPORTED_DEFAULTS },
    vms: vms.map(buildVm),
    stopOnError,
    concurrency,
  }
}

function getProblem(entry: unknown): V2vStartProblem | undefined {
  if (!hasObjectProperty(entry, 'message') || typeof entry.message !== 'string') {
    return undefined
  }

  const vmId = hasObjectProperty(entry, 'vm') && typeof entry.vm === 'string' ? (entry.vm as XoV2vVm['id']) : undefined

  return vmId === undefined ? { message: entry.message } : { vmId, message: entry.message }
}

// The back end reports every problem of a refused launch at once (`invalidParameters`)
export function getV2vStartProblems(error: unknown): V2vStartProblem[] | undefined {
  const errorData = getUnprocessableEntityData(error)
  const errors = hasObjectProperty(errorData, 'errors') ? errorData.errors : undefined

  if (!Array.isArray(errors)) {
    return undefined
  }

  const problems = errors.map(getProblem).filter(problem => problem !== undefined)

  return problems.length === 0 ? undefined : problems
}
