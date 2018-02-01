export const parseProp = (type, obj, name, defaultValue) => {
  const value = obj[name]
  if (
    value == null ||
    value === '' // do not warn on this trivial and minor error
  ) {
    return defaultValue
  }
  try {
    return JSON.parse(value)
  } catch (error) {
    // do not display the error because it can occurs a lot and fill
    // up log files
    return defaultValue
  }
}
