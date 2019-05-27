import { isInteger, mapValues, pickBy } from 'lodash'

const asBoolean = value => Boolean(value)
const asInteger = value => String(value)
const filterUndefineds = obj => pickBy(obj, value => value !== undefined)

const prepareXapiParam = param => {
  if (isInteger(param)) {
    return asInteger(param)
  }
  if (typeof param === 'boolean') {
    return asBoolean(param)
  }
  if (Array.isArray(param)) {
    return param.map(prepareXapiParam)
  }
  if (typeof param === 'object') {
    return mapValues(filterUndefineds(param), prepareXapiParam)
  }
  return param
}

export { prepareXapiParam as default }
