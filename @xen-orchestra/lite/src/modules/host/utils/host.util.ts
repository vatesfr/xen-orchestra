import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { castArray } from 'lodash-es'

export type HostState = Lowercase<HOST_POWER_STATE> | 'disabled'

const RUNNING_CHANGING_STATE_OPERATIONS = [
  HOST_OPERATION.ENABLE,
  HOST_OPERATION.EVACUATE,
  HOST_OPERATION.REBOOT,
  HOST_OPERATION.SHUTDOWN,
]

const NOT_RUNNING_CHANGING_STATE_OPERATIONS = [HOST_OPERATION.POWER_ON]

export const isHostOperationPending = (host: XenApiHost, operations: HOST_OPERATION[] | HOST_OPERATION) => {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export const getHostPendingOperation = (host: XenApiHost, operations: HOST_OPERATION[] | HOST_OPERATION) => {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).find(operation => currentOperations.includes(operation))
}

export const getHostPendingStateOperation = (host: XenApiHost, isHostRunning: boolean) =>
  getHostPendingOperation(
    host,
    isHostRunning ? RUNNING_CHANGING_STATE_OPERATIONS : NOT_RUNNING_CHANGING_STATE_OPERATIONS
  )

export const getHostState = (host: XenApiHost, powerState: HOST_POWER_STATE): HostState => {
  if (powerState === HOST_POWER_STATE.UNKNOWN) {
    return 'unknown'
  }

  if (powerState === HOST_POWER_STATE.HALTED) {
    return 'halted'
  }

  return host.enabled ? 'running' : 'disabled'
}
