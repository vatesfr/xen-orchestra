// Prepare values before passing them to the XenAPI:
//
// - cast integers to strings
export default function prepare(param) {
  if (Number.isInteger(param)) {
    return String(param)
  }

  if (typeof param !== 'object' || param === null) {
    return param
  }

  if (Array.isArray(param)) {
    return param.map(prepare)
  }

  const values = {}
  Object.keys(param).forEach(key => {
    const value = param[key]
    if (value !== undefined) {
      values[key] = prepare(value)
    }
  })
  return values
}
