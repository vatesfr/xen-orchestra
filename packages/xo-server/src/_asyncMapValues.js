import zipObject from 'lodash/zipObject.js'

export const asyncMapValues = async (object, iteratee) => {
  const keys = Object.keys(object)
  return zipObject(keys, await Promise.all(keys.map(key => iteratee(object[key], key, object))))
}
