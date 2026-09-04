import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { castArray } from 'lodash-es'

const CHANGING_STATE_OPERATIONS = [HOST_OPERATION.EVACUATE, HOST_OPERATION.REBOOT, HOST_OPERATION.SHUTDOWN]

export const isHostOperationPending = (host: XenApiHost, operations: HOST_OPERATION[] | HOST_OPERATION) => {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export const getHostPendingOperation = (host: XenApiHost, operations: HOST_OPERATION[] | HOST_OPERATION) => {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).find(operation => currentOperations.includes(operation))
}

export const getHostPendingStateOperation = (host: XenApiHost) =>
  getHostPendingOperation(host, CHANGING_STATE_OPERATIONS)
