import humanFormat from 'human-format'

export const STATUS_ICON = {
  failure: '🚨',
  interrupted: '⚠️',
  skipped: '⏩',
  success: '✔',
}

export const INDENT = '  '

export const formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B',
  })

export const formatSpeed = (bytes, milliseconds) =>
  milliseconds > 0
    ? humanFormat((bytes * 1e3) / milliseconds, {
        scale: 'binary',
        unit: 'B/s',
      })
    : 'N/A'
