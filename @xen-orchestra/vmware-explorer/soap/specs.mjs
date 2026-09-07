/**
 * Builders for the vim25 arguments we hand to the SOAP library.
 *
 * The schema declares every complex type as an `xs:sequence`, so the server rejects a spec whose
 * children are out of order — and the library derives that order from JS key insertion order,
 * which is exactly the kind of thing that breaks silently when an object is refactored or when a
 * field is renamed. Declaring the order explicitly here makes it reviewable and testable.
 *
 * Each list is the full schema order; only the elements which are actually set get emitted. A type
 * extending another puts the elements of the base type first.
 */

const FILE_BACKING = ['fileName', 'datastore', 'backingObjectId']

export const PROPERTY_SPEC = Object.freeze(['type', 'all', 'pathSet'])

export const TRAVERSAL_SPEC = Object.freeze(['name', 'type', 'path', 'skip', 'selectSet'])

export const OBJECT_SPEC = Object.freeze(['obj', 'skip', 'selectSet'])

export const PROPERTY_FILTER_SPEC = Object.freeze(['propSet', 'objectSet', 'reportMissingObjectsInResults'])

export const RETRIEVE_OPTIONS = Object.freeze(['maxObjects'])

export const VIRTUAL_DEVICE = Object.freeze([
  'key',
  'deviceInfo',
  'backing',
  'connectable',
  'slotInfo',
  'controllerKey',
  'unitNumber',
])

export const VIRTUAL_DISK = Object.freeze([
  ...VIRTUAL_DEVICE,
  'capacityInKB',
  'capacityInBytes',
  'shares',
  'storageIOAllocation',
  'diskObjectId',
  'vFlashCacheConfigInfo',
  'iofilter',
  'vDiskId',
])

export const VIRTUAL_DEVICE_CONFIG_SPEC = Object.freeze(['operation', 'fileOperation', 'device', 'profile', 'backing'])

/** subset of VirtualMachineConfigSpec, in schema order */
export const VIRTUAL_MACHINE_CONFIG_SPEC = Object.freeze([
  'name',
  'version',
  'uuid',
  'guestId',
  'files',
  'numCPUs',
  'memoryMB',
  'deviceChange',
  'cpuFeatureMask',
  'extraConfig',
])

/**
 * Element order of every virtual disk backing type we may have to echo back.
 *
 * Only `fileName` and `diskMode` are usually set ( plus `parent` / `deltaDiskFormat` if a delta
 * ever has to be created ), but the type has to match the one the host reported for the disk, so
 * all of them are declared.
 */
export const DISK_BACKINGS = Object.freeze({
  VirtualDiskFlatVer2BackingInfo: Object.freeze([
    ...FILE_BACKING,
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
  ]),
  VirtualDiskSeSparseBackingInfo: Object.freeze([
    ...FILE_BACKING,
    'diskMode',
    'writeThrough',
    'uuid',
    'contentId',
    'changeId',
    'parent',
    'deltaDiskFormat',
    'digestEnabled',
    'grainSize',
    'keyId',
  ]),
  VirtualDiskSparseVer2BackingInfo: Object.freeze([
    ...FILE_BACKING,
    'diskMode',
    'split',
    'writeThrough',
    'spaceUsedInKB',
    'uuid',
    'contentId',
    'changeId',
    'parent',
    'keyId',
  ]),
  VirtualDiskRawDiskMappingVer1BackingInfo: Object.freeze([
    ...FILE_BACKING,
    'lunUuid',
    'deviceName',
    'compatibilityMode',
    'diskMode',
    'uuid',
    'contentId',
    'changeId',
    'parent',
  ]),
})

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
 * abstract type, e.g. the `device` of a VirtualDeviceConfigSpec
 * @param {object} values
 * @returns {object}
 */
export function orderedChildren(order, xsiType, values) {
  const unknown = Object.keys(values).filter(name => values[name] !== undefined && !order.includes(name))
  if (unknown.length > 0) {
    // a typo in a field name would otherwise be silently dropped from the request
    throw new Error(`unknown element(s) for this type: ${unknown.join(', ')}`)
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

/**
 * A virtual disk backing, with the `xsi:type` the host reported for it.
 *
 * @param {string} xsiType
 * @param {object} values
 * @returns {object}
 */
export function diskBacking(xsiType, values) {
  const order = DISK_BACKINGS[xsiType]
  if (order === undefined) {
    throw new Error(`unsupported virtual disk backing type: ${xsiType}`)
  }
  return orderedChildren(order, xsiType, values)
}

/**
 * A VirtualDisk device. `values.backing` must be built by {@link diskBacking}.
 *
 * @param {object} values
 * @returns {object}
 */
export function virtualDisk(values) {
  return orderedChildren(VIRTUAL_DISK, 'VirtualDisk', values)
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
