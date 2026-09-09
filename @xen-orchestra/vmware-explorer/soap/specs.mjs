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
