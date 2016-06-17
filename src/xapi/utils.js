// import isFinite from 'lodash.isfinite'
import pickBy from 'lodash.pickby'
import { utcFormat, utcParse } from 'd3-time-format'

import {
  createRawObject,
  forEach,
  isBoolean,
  isInteger,
  isObject,
  map
} from '../utils'

// ===================================================================

export const asBoolean = value => Boolean(value)

// const asFloat = value => {
//   value = String(value)
//   return value.indexOf('.') === -1
//     ? `${value}.0`
//     : value
// }

export const asInteger = value => String(value)

export const filterUndefineds = obj => pickBy(obj, value => value !== undefined)

export const optional = (value, fn) => value == null
  ? undefined
  : fn ? fn(value) : value

export const prepareXapiParam = param => {
  // if (isFinite(param) && !isInteger(param)) {
  //   return asFloat(param)
  // }
  if (isInteger(param)) {
    return asInteger(param)
  }
  if (isBoolean(param)) {
    return asBoolean(param)
  }
  if (isObject(param)) {
    return map(filterUndefineds(param), prepareXapiParam)
  }

  return param
}

// -------------------------------------------------------------------

const OPAQUE_REF_RE = /OpaqueRef:[0-9a-z-]+/
export const extractOpaqueRef = str => {
  const matches = OPAQUE_REF_RE.exec(str)
  if (!matches) {
    throw new Error('no opaque ref found')
  }
  return matches[0]
}

// -------------------------------------------------------------------

const TYPE_TO_NAMESPACE = createRawObject()
forEach([
  'Bond',
  'DR_task',
  'GPU_group',
  'PBD',
  'PCI',
  'PGPU',
  'PIF',
  'PIF_metrics',
  'SM',
  'SR',
  'VBD',
  'VBD_metrics',
  'VDI',
  'VGPU',
  'VGPU_type',
  'VLAN',
  'VM',
  'VM_appliance',
  'VM_guest_metrics',
  'VM_metrics',
  'VMPP',
  'VTPM'
], namespace => {
  TYPE_TO_NAMESPACE[namespace.toLowerCase()] = namespace
})

// Object types given by `xen-api` are always lowercase but the
// namespaces in the Xen API can have a different casing.
export const getNamespaceForType = type => TYPE_TO_NAMESPACE[type] || type

// -------------------------------------------------------------------

// Format a date (pseudo ISO 8601) from one XenServer get by
// xapi.call('host.get_servertime', host.$ref) for example
export const formatDateTime = utcFormat('%Y%m%dT%H:%M:%SZ')

export const parseDateTime = utcParse('%Y%m%dT%H:%M:%SZ')

// -------------------------------------------------------------------

export const isHostRunning = host => {
  const { $metrics } = host

  return $metrics && $metrics.live
}

// -------------------------------------------------------------------

export const isVmHvm = vm => Boolean(vm.HVM_boot_policy)

const VM_RUNNING_POWER_STATES = {
  Running: true,
  Paused: true
}
export const isVmRunning = vm => VM_RUNNING_POWER_STATES[vm.power_state]
