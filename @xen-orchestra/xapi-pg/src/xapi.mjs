import { getRefFromType } from './types.mjs'

/**
 * @enum {string}
 */
export const LifeCycleStates = {
  Prototype: 'Prototype_s',
  Published: 'Published_s',
  Deprecated: 'Deprecated_s',
  Removed: 'Removed_s',
}
/**
 * @typedef {{name: string, description: string, type: string}} TransformedField A class field
 */

/**
 * @typedef {{name: string, description: string, fields: Object.<string, TransformedField>, enums:[]}} TransformedClass
 */
/**
 * return a class dict where the classes and their fields are filtered and the extra attributes are removed.
 * @param {Set<LifeCycleStates>} lifecycleStates the lifecycles states we want to keep
 * @param {(c: TransformedClass) => boolean} filter a filter to pass for classes to be included
 * @param {[*]} jsonData the input API JSON representation
 * @param {Set<string> | null} removedClassNames
 * @returns {Object<string, TransformedClass>} the filtered class dictionary
 */
export function loadXapiClasses(lifecycleStates, filter, jsonData, removedClassNames = null) {
  if (removedClassNames == null) {
    removedClassNames = new Set()
  }
  // some published fields seem to point to deprecated types, host.this_user is an example.
  // some deprecated fields seem to point to removed types, VM.protection_policy is an example.
  const apiFilter = e => lifecycleStates.has(e.lifecycle.state)
  const publishedClasses = jsonData.filter(apiFilter).filter(c => !removedClassNames.has(c.name))

  const classNames = new Set(publishedClasses.map(c => c.name))

  // delete fields pointing to filtered-out classes or filtered by lifecycle
  function filterField(f) {
    if (apiFilter(f)) {
      const ref = getRefFromType(f.type)
      return ref === null || classNames.has(ref)
    }
    return false
  }

  /**
   *
   * @param fields
   * @returns {{[p: string]: TransformedField}}
   */
  function createFieldDict(fields) {
    return Object.fromEntries(
      fields.map(f => [
        f.name,
        {
          name: f.name,
          description: f.description,
          type: f.type,
          default: f.default,
        },
      ])
    )
  }

  const transformedClasses = publishedClasses.map(c => ({
    fields: createFieldDict(c.fields.filter(filterField)),
    name: c.name,
    description: c.description,
    enums: c.enums,
  }))

  const keptClasses = new Set(transformedClasses.filter(filter).map(c => c.name))
  const newlyRemovedClasses = classNames.difference(keptClasses)
  // this weird loop allows us to define a filter based on transformed classes.
  // The trick is that we learn very late of the disappearance, we have to redo the parsing to remove all the references to deleted classes.
  if (newlyRemovedClasses.size > 0) {
    return loadXapiClasses(lifecycleStates, filter, jsonData, newlyRemovedClasses)
  }
  return Object.fromEntries(transformedClasses.map(c => [c.name, c]))
}

/**
 * @type {string}
 */
export const NULL_REF = 'OpaqueRef:NULL'
