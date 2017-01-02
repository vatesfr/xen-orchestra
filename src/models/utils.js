import prettyFormat from 'pretty-format'

export const parseProp = (type, obj, name, defaultValue) => {
  const value = obj[name]
  if (value == null) {
    return defaultValue
  }
  try {
    return JSON.parse(value)
  } catch (error) {
    console.warn('cannot parse %ss[%j].%s (%s):', type, obj.id, name, prettyFormat(value), error)
    return defaultValue
  }
}
