/**
 * XO Server OpenMetrics Plugin — entry point.
 *
 * This module is what xo-server loads. It owns the public contract:
 * - the default export: the plugin factory (with `configurationSchema`
 *   attached) that xo-server instantiates;
 * - the `configurationSchema` named export;
 * - re-exports of the runtime helpers and shared types that existing importers
 *   (formatter, child process, tests) depend on.
 *
 * The plugin itself (lifecycle + wiring) lives in
 * `./plugin/open-metrics-plugin.mjs`; child-process management in
 * `./plugin/child-process-manager.mjs`; data shaping in
 * `./plugin/data-providers/` and `./xostor/`.
 */

import type { XoApp } from '@vates/types'
import { getRandomValues } from 'node:crypto'

import OpenMetricsPlugin from './plugin/open-metrics-plugin.mjs'

// Re-export so existing importers of the SR-UUID truncation helpers keep working.
export { SR_UUID_TRUNCATIONS, indexSrUuidTruncations } from './plugin/data-providers/label-lookup.mjs'

// Re-export so existing importers of `XOSTOR_UPDATE_PACKAGES` keep working.
export { XOSTOR_UPDATE_PACKAGES } from './xostor/parsers.mjs'

// Re-export the shared types so existing importers (formatter, tests) keep working.
export type {
  HostCredentials,
  IpcMessage,
  PendingRequest,
  PluginConfiguration,
  ServerConfiguration,
} from './types/ipc.mjs'
export type {
  HostLabelInfo,
  HostStatusItem,
  HostStatusPayload,
  LabelLookupData,
  SrDataItem,
  SrDataPayload,
  SrLabelInfo,
  VdiDataItem,
  VdiDataPayload,
  VmLabelInfo,
  VmStatusItem,
  VmStatusPayload,
  XapiCredentialsPayload,
  XoMetricsData,
  XoObject,
} from './types/domain.mjs'
export type {
  XostorAlarmEntry,
  XostorAlarmsItem,
  XostorAlarmsPayload,
  XostorClusterItem,
  XostorHealthCheckRaw,
  XostorNodeItem,
  XostorPayload,
  XostorSmartDevice,
  XostorSmartHost,
  XostorSmartPayload,
  XostorUpdateItem,
  XostorUpdatePackage,
  XostorUpdatesPayload,
} from './types/xostor.mjs'

// ============================================================================
// Configuration Schema (exported for xo-server)
// ============================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    secret: {
      type: 'string',
      title: 'Prometheus secret',
      description: 'Add this secret to http_config > authorization > credentials, and set type to Bearer',
      default: Buffer.from(getRandomValues(new Uint32Array(8))).toString('hex'),
    },
  },
  additionalProperties: false,
}

// ============================================================================
// Plugin Factory (exported for xo-server)
// ============================================================================

interface PluginOptions {
  xo: XoApp
}

function pluginFactory({ xo }: PluginOptions): OpenMetricsPlugin {
  return new OpenMetricsPlugin(xo)
}
pluginFactory.configurationSchema = configurationSchema

export default pluginFactory
