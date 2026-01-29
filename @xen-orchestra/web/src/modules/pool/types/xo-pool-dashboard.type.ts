import type { XcpPatches, XoAlarm, XoHost, XoSr, XoVm, XsPatches } from '@vates/types'

export type XoPoolDashboard = {
  hosts?: {
    status?: {
      running: number
      disabled: number
      halted: number
      total: number
    }
    topFiveUsage?: {
      ram: { name_label: string; size: number; usage: number; percent: number; id: XoHost['id'] }[]
      cpu: { name_label: string; percent: number; id: XoHost['id'] }[]
    }
    missingPatches?:
      | {
          hasAuthorization: false
        }
      | { hasAuthorization: true; missingPatches: (XcpPatches | XsPatches)[] }
  }
  vms?: {
    status?: {
      running: number
      halted: number
      paused: number
      total: number
      suspended: number
    }
    topFiveUsage?: {
      cpu: { id: XoVm['id']; name_label: string; percent: number }[]
      ram: { id: XoVm['id']; name_label: string; percent: number; memory: number; memoryFree: number }[]
      isExpired?: boolean
    }
  }
  srs?: {
    topFiveUsage?: {
      name_label: string
      id: XoSr['id']
      percent: number
      physical_usage: number
      size: number
    }[]
  }
  alarms?: XoAlarm['id'][]
  cpuProvisioning?: {
    total: number
    assigned: number
    percent: number
  }
}
