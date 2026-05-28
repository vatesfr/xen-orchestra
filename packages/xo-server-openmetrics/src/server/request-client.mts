/**
 * Parent-request client — child process.
 *
 * Owns the IPC request/response correlation state: a map of in-flight requests
 * keyed by a generated id, each with its resolve/reject and timeout. Exposes the
 * typed `request*` helpers the collector uses to ask the parent for data, the
 * `sendToParent` primitive, and the `handleParentResponse` hook the entry's IPC
 * router calls to settle a pending request when a matching reply arrives.
 *
 * This is the send side of the IPC boundary; `process.send` / `process.connected`
 * are used exactly as the original child did.
 */

import { createLogger } from '@xen-orchestra/log'

import type { IpcMessage } from '../types/ipc.mjs'
import type {
  HostStatusPayload,
  SrDataPayload,
  VdiDataPayload,
  VmStatusPayload,
  XapiCredentialsPayload,
} from '../types/domain.mjs'
import type {
  XoMetricsData,
  XostorAlarmsPayload,
  XostorPayload,
  XostorSmartPayload,
  XostorUpdatesPayload,
} from '../openmetric-formatter.mjs'

const logger = createLogger('xo:xo-server-openmetrics:child')

// ============================================================================
// Types
// ============================================================================

interface PendingRequest<T> {
  resolve: (value: T) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

// ============================================================================
// State
// ============================================================================

const pendingRequests = new Map<string, PendingRequest<unknown>>()
let requestIdCounter = 0

// ============================================================================
// Constants
// ============================================================================

const IPC_REQUEST_TIMEOUT_MS = 30_000

// ============================================================================
// IPC Communication
// ============================================================================

export function sendToParent(message: IpcMessage): void {
  if (process.send !== undefined && process.connected) {
    process.send(message)
  }
}

/**
 * Settle the pending request matching an incoming parent reply. Called by the
 * entry's IPC router for every data-response message type.
 */
export function handleParentResponse(message: IpcMessage): void {
  const requestId = message.requestId
  if (requestId === undefined) {
    return
  }

  const pending = pendingRequests.get(requestId)
  if (pending !== undefined) {
    clearTimeout(pending.timer)
    pendingRequests.delete(requestId)
    pending.resolve(message.payload)
  }
}

/**
 * Reject and clear every in-flight request. Called by the entry during cleanup
 * so no request promise is left dangling when the server shuts down.
 */
export function rejectAllPending(): void {
  for (const pending of pendingRequests.values()) {
    clearTimeout(pending.timer)
    pending.reject(new Error('Server shutting down'))
  }
  pendingRequests.clear()
}

// ============================================================================
// XAPI Credentials Request
// ============================================================================

export async function requestXapiCredentials(): Promise<XapiCredentialsPayload> {
  const requestId = `creds-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for XAPI credentials from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as XapiCredentialsPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_XAPI_CREDENTIALS', requestId })
  })
}

export async function requestSrData(): Promise<SrDataPayload> {
  const requestId = `sr-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for SR data from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as SrDataPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_SR_DATA', requestId })
  })
}

export async function requestVdiData(): Promise<VdiDataPayload> {
  const requestId = `vdi-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for VDI data from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as VdiDataPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_VDI_DATA', requestId })
  })
}

export async function requestHostStatusData(): Promise<HostStatusPayload> {
  const requestId = `host-status-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for host status data from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as HostStatusPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_HOST_STATUS', requestId })
  })
}

export async function requestVmStatusData(): Promise<VmStatusPayload> {
  const requestId = `vm-status-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for VM status data from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as VmStatusPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_VM_STATUS', requestId })
  })
}

export async function requestXoMetrics(): Promise<XoMetricsData> {
  const requestId = `xo-metrics-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for XO metrics from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as XoMetricsData),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_XO_METRICS', requestId })
  })
}

export async function requestXostorData(): Promise<XostorPayload> {
  const requestId = `xostor-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for XOSTOR data from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as XostorPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_XOSTOR_DATA', requestId })
  })
}

export async function requestXostorAlarms(): Promise<XostorAlarmsPayload> {
  const requestId = `xostor-alarms-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for XOSTOR alarms from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as XostorAlarmsPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_XOSTOR_ALARMS', requestId })
  })
}

export async function requestXostorSmart(): Promise<XostorSmartPayload> {
  const requestId = `xostor-smart-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for XOSTOR SMART data from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as XostorSmartPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_XOSTOR_SMART', requestId })
  })
}

export async function requestXostorUpdates(): Promise<XostorUpdatesPayload> {
  const requestId = `xostor-updates-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Timeout waiting for XOSTOR updates from parent'))
    }, IPC_REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      resolve: value => resolve(value as XostorUpdatesPayload),
      reject,
      timer,
    })

    sendToParent({ type: 'GET_XOSTOR_UPDATES', requestId })
  })
}

// ============================================================================
// XOSTOR request safety wrapper
// ============================================================================

/**
 * Wrap an XOSTOR IPC request so any failure logs a warning and yields the
 * supplied fallback. Keeps `/metrics` responding even when one collector
 * misbehaves.
 */
export function safeXostorRequest<T>(promise: Promise<T>, label: string, empty: T): Promise<T> {
  return promise.catch((err: unknown) => {
    logger.warn(`XOSTOR ${label} request failed; emitting empty payload`, { error: err })
    return empty
  })
}
