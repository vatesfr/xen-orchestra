import type {
  AnyXoVdi,
  AnyXoVm,
  XoGpuGroup,
  XoHost,
  XoHostPatch,
  XoMessage,
  XoNetwork,
  XoPbd,
  XoPci,
  XoPgpu,
  XoPif,
  XoPool,
  XoSm,
  XoSr,
  XoVbd,
  XoVgpu,
  XoVgpuType,
  XoVif,
  XoVtpm,
} from '@vates/types'

// Keyed by the lowercased `$type`, as the transform looks it up. Types without
// an `@vates/types` counterpart (task, pool_patch, bond, USB…) and the metrics
// types (no transform, always `undefined`) are left out on purpose.
export type XoObjectByXapiType = {
  gpu_group: XoGpuGroup
  host: XoHost
  host_patch: XoHostPatch
  message: XoMessage
  network: XoNetwork
  pbd: XoPbd
  pci: XoPci
  pgpu: XoPgpu
  pif: XoPif
  pool: XoPool
  sm: XoSm
  sr: XoSr
  vbd: XoVbd
  vdi: AnyXoVdi
  vgpu: XoVgpu
  vgpu_type: XoVgpuType
  vif: XoVif
  vm: AnyXoVm
  vtpm: XoVtpm
}

export type XapiType = keyof XoObjectByXapiType

export type XoObjectOf<TType extends string> =
  Lowercase<TType> extends XapiType ? XoObjectByXapiType[Lowercase<TType>] : unknown

// The enriched record also carries `$<field>` link getters generated at
// runtime, which no static type describes.
export type XapiRecord<TType extends string = string> = Record<string, any> & { $type: TType }

declare function xapiObjectToXo<TType extends string>(
  xapiObject: XapiRecord<TType>,
  dependents?: Record<string, string>
): XoObjectOf<TType> | undefined

export default xapiObjectToXo
export { xapiObjectToXo }
