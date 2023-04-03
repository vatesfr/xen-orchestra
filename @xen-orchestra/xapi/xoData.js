'use strict'

const assert = require('node:assert/strict')

// This module provides a way to associate data with a XAPI object.
//
// The data is stored as a JSON object in the `other_config` field of the XAPI object, under the name `xo:${uuid.slice(0, 8})}.
//
// The UUID prefix must match the object UUID, because the `other_config` entries are preserved when objects are copied (e.g. VM.copy).

/**
 * Gets XO data associated with an object.
 *
 * @param {object} params
 * @param {object} params.other_config - The other_config of the object.
 * @param {string} params.uuid - The UUID of the object.
 * @returns {Promise<object|undefined>} A Promise that resolves to the parsed data object, or undefined if there is no data.
 */
exports.extract = function extract({ other_config, uuid }) {
  const json = other_config['xo:' + uuid.slice(0, 8)]
  if (json !== undefined) {
    return JSON.parse(json)
  }
}

/**
 * Updates the XO data for an object.
 *
 * @param {string} $type - The type of the object.
 * @param {string} $ref - The reference of the object.
 * @param {string} $xapi - The XAPI connection to the pool this object belongs to.
 * @param {string} uuid - The UUID of the object.
 * @param {object|null} data - The data to merge with the XO data associated with the object. If null, the XO data for the object will be cleared.
 * @returns {Promise<object|undefined>} A Promise that resolves to the updated XO data object, or undefined if the XO data for the given object is cleared.
 */
exports.set = async function set({ $type, $ref, $xapi, uuid }, data) {
  assert.equal(typeof data, 'object') // includes null
  assert(!Array.isArray(data))

  const key = 'xo:' + uuid.slice(0, 8)

  if (data === null) {
    await $xapi.setFieldEntry($type, $ref, 'other_config', key, null)
    return
  }

  let existingData
  do {
    try {
      const finalData = existingData === undefined ? data : { ...existingData, ...data }

      await $xapi.call($type + '.add_to_other_config', $ref, key, JSON.stringify(finalData))

      return finalData
    } catch (error) {
      if (error.code !== 'MAP_DUPLICATE_KEY') {
        throw error
      }
    }

    const json = (await $xapi.getField($type, $ref, 'other_config'))[key]

    if (json === undefined) {
      // data has already been cleared, nothing to clean
    } else {
      try {
        existingData = JSON.parse(json)
      } catch (error) {
        // ignore invalid JSON, simply delete
        if (!(error instanceof SyntaxError)) {
          throw error
        }
      }

      await $xapi.call($type + '.remove_from_other_config', $ref, key)
    }
  } while (true)
}
