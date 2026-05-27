/**
 * IPC contract shared between the parent plugin (`index.mts`) and the forked
 * child process (`open-metric-server.mts`).
 *
 * These are TYPE declarations only (erased at compile time), so importing them
 * from both processes introduces no runtime coupling — it just gives the IPC
 * boundary a single source of truth.
 */

interface IpcMessage {
  type: string
  payload?: unknown
  requestId?: string
  error?: string
}

interface PluginConfiguration {
  secret: string
}

interface ServerConfiguration {
  port: number
  bindAddress: string
  secret: string
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

interface HostCredentials {
  hostId: string
  hostAddress: string
  hostLabel: string
  poolId: string
  poolLabel: string
  sessionId: string
  protocol: string
}

export type { IpcMessage, PluginConfiguration, ServerConfiguration, PendingRequest, HostCredentials }
