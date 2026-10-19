/**
 * Builders for the vim25 arguments we hand to the SOAP library.
 *
 * The schema declares every complex type as an `xs:sequence`, so the server rejects a spec whose
 * children are out of order — and the library derives that order from JS key insertion order,
 * which is exactly the kind of thing that breaks silently when an object is refactored or when a
 * field is renamed. Declaring the order explicitly here makes it reviewable and testable.
 *
 * Each list is the full schema order; only the elements which are actually set get emitted.
 */

export const PROPERTY_SPEC = Object.freeze(['type', 'all', 'pathSet'])

export const TRAVERSAL_SPEC = Object.freeze(['name', 'type', 'path', 'skip', 'selectSet'])

export const OBJECT_SPEC = Object.freeze(['obj', 'skip', 'selectSet'])

export const PROPERTY_FILTER_SPEC = Object.freeze(['propSet', 'objectSet', 'reportMissingObjectsInResults'])

export const RETRIEVE_OPTIONS = Object.freeze(['maxObjects'])

// not a complex type but the parameter sequence of a method, which the schema orders just the same:
// sending `snapshot` after `startOffset` makes the host answer `Required parameter changeId is
// missing`, naming a parameter which was in fact sent
export const QUERY_CHANGED_DISK_AREAS = Object.freeze(['_this', 'snapshot', 'deviceKey', 'startOffset', 'changeId'])

// only the part of the sequence this package sends: the whole type counts dozens of elements, an
// element added here must be inserted at its place in the schema
export const VIRTUAL_MACHINE_CONFIG_SPEC = Object.freeze(['deviceChange'])

export const VIRTUAL_DEVICE_CONFIG_SPEC = Object.freeze([
  'operation',
  'fileOperation',
  'device',
  'profile',
  'backing',
  'filterSpec',
  'changeMode',
])

// the elements of VirtualDevice, then the first ones of VirtualDisk: `capacityInKB` is not optional
// in the schema, even for a disk whose file already exists
export const VIRTUAL_DISK = Object.freeze([
  'key',
  'deviceInfo',
  'backing',
  'connectable',
  'slotInfo',
  'controllerKey',
  'unitNumber',
  'numaNode',
  'deviceGroupInfo',
  'capacityInKB',
  'capacityInBytes',
])

// the elements of VirtualDeviceFileBackingInfo, then the ones of VirtualDiskFlatVer2BackingInfo
export const VIRTUAL_DISK_FLAT_VER2_BACKING_INFO = Object.freeze([
  'fileName',
  'datastore',
  'backingObjectId',
  'diskMode',
  'split',
  'writeThrough',
  'thinProvisioned',
  'eagerlyScrub',
  'uuid',
  'contentId',
  'changeId',
  'parent',
  'deltaDiskFormat',
  'digestEnabled',
  'deltaGrainSize',
  'deltaDiskFormatVariant',
  'sharing',
  'keyId',
])

/**
 * A managed object reference.
 *
 * @param {string} type - type of the object, e.g. `VirtualMachine`
 * @param {string} value - the reference itself, e.g. `vm-42`
 * @returns {object}
 */
export function moRef(type, value) {
  return { attributes: { type }, $value: value }
}

/**
 * Builds an element, its children in schema order, skipping the values which are not set.
 *
 * @param {ReadonlyArray<string>} order - schema element order
 * @param {string | undefined} xsiType - type to declare, mandatory wherever the schema declares an
 * abstract type, e.g. the `selectSet` of an ObjectSpec
 * @param {object} values
 * @returns {object}
 */
export function orderedChildren(order, xsiType, values) {
  const unknown = Object.keys(values).filter(name => values[name] !== undefined && !order.includes(name))
  if (unknown.length > 0) {
    // a typo in a field name would otherwise be silently dropped from the request
    const error = new Error(`unknown element(s) for this type: ${unknown.join(', ')}`)
    // this spec is built here, not by the host: such a failure is a bug of this package
    error.code = 'BAD_VIM25_SPEC'
    throw error
  }

  // the attributes are not an element, but the library expects them first
  const node = xsiType === undefined ? {} : { attributes: { 'xsi:type': xsiType } }
  for (const name of order) {
    const value = values[name]
    if (value !== undefined && value !== null) {
      node[name] = value
    }
  }
  return node
}

export function propertySpec(values) {
  return orderedChildren(PROPERTY_SPEC, 'PropertySpec', values)
}

export function traversalSpec(values) {
  return orderedChildren(TRAVERSAL_SPEC, 'TraversalSpec', values)
}

export function objectSpec(values) {
  return orderedChildren(OBJECT_SPEC, 'ObjectSpec', values)
}

export function propertyFilterSpec(values) {
  return orderedChildren(PROPERTY_FILTER_SPEC, 'PropertyFilterSpec', values)
}

export function retrieveOptions(values) {
  return orderedChildren(RETRIEVE_OPTIONS, 'RetrieveOptions', values)
}

/**
 * Arguments of `QueryChangedDiskAreas`.
 *
 * The arguments of a method are elements too, and carry no `xsi:type`.
 *
 * @param {object} values
 * @returns {object}
 */
export function queryChangedDiskAreasArgs(values) {
  return orderedChildren(QUERY_CHANGED_DISK_AREAS, undefined, values)
}

export function virtualMachineConfigSpec(values) {
  return orderedChildren(VIRTUAL_MACHINE_CONFIG_SPEC, 'VirtualMachineConfigSpec', values)
}

export function virtualDeviceConfigSpec(values) {
  return orderedChildren(VIRTUAL_DEVICE_CONFIG_SPEC, 'VirtualDeviceConfigSpec', values)
}

export function virtualDisk(values) {
  return orderedChildren(VIRTUAL_DISK, 'VirtualDisk', values)
}

export function virtualDiskFlatVer2BackingInfo(values) {
  return orderedChildren(VIRTUAL_DISK_FLAT_VER2_BACKING_INFO, 'VirtualDiskFlatVer2BackingInfo', values)
}
