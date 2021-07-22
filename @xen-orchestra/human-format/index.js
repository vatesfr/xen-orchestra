import humanFormat from 'human-format'

function safeHumanFormat(value, opts) {
  try {
    return humanFormat(value, opts)
  } catch (error) {
    console.error('humanFormat', value, opts, error)
    return 'N/D'
  }
}

export const formatSize = bytes => (bytes != null ? safeHumanFormat(bytes, { scale: 'binary', unit: 'B' }) : 'N/D')

export const formatSizeShort = bytes => safeHumanFormat(bytes, { scale: 'binary', unit: 'B', decimals: 0 })

export const formatSizeRaw = bytes => humanFormat.raw(bytes, { scale: 'binary', unit: 'B' })

export const formatSpeed = (bytes, milliseconds) =>
  safeHumanFormat((bytes * 1e3) / milliseconds, {
    scale: 'binary',
    unit: 'B/s',
  })

const timeScale = new humanFormat.Scale({
  ns: 1e-6,
  µs: 1e-3,
  ms: 1,
  s: 1e3,
  min: 60 * 1e3,
  h: 3600 * 1e3,
  d: 86400 * 1e3,
  y: 2592000 * 1e3,
})
export const formatTime = milliseconds => safeHumanFormat(milliseconds, { scale: timeScale, decimals: 0 })

export const parseSize = size => {
  let bytes = humanFormat.parse.raw(size, { scale: 'binary' })
  if (bytes.unit && bytes.unit !== 'B') {
    bytes = humanFormat.parse.raw(size)

    if (bytes.unit && bytes.unit !== 'B') {
      throw new Error('invalid size: ' + size)
    }
  }
  return Math.floor(bytes.value * bytes.factor)
}
