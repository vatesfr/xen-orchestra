/**
 * OpenMetrics Formatter Module
 *
 * Converts parsed RRD metrics to OpenMetrics/Prometheus format.
 * Defines metric mappings with transformations and labels.
 *
 * This module is now a thin barrel re-exporting the formatter submodules
 * under `./formatter/` and the XOSTOR formatters under `./xostor/`.
 */

export * from './formatter/primitives.mjs'
export * from './formatter/definitions.mjs'
export * from './formatter/rrd-formatters.mjs'
export * from './formatter/entity-formatters.mjs'
export * from './formatter/xo-metrics-formatter.mjs'
export * from './xostor/formatters.mjs'

export type { HostStatusItem, SrDataItem, VdiDataItem, VmStatusItem, XoMetricsData } from './types/domain.mjs'
export type {
  XostorAlarmEntry,
  XostorAlarmsItem,
  XostorAlarmsPayload,
  XostorClusterItem,
  XostorPayload,
  XostorSmartDevice,
  XostorSmartHost,
  XostorSmartPayload,
  XostorUpdateItem,
  XostorUpdatePackage,
  XostorUpdatesPayload,
} from './types/xostor.mjs'
