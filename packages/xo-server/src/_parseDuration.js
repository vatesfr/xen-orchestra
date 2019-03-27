import ms from 'ms'

export default value => {
  if (typeof value === 'number') {
    return value
  }
  const duration = ms(value)
  if (duration === undefined) {
    throw new TypeError(`not a valid duration: ${duration}`)
  }
  return duration
}
