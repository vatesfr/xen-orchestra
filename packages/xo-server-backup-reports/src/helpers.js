import humanFormat from 'human-format'
import moment from 'moment-timezone'

const ICON_FAILURE = '🚨'
const ICON_INTERRUPTED = '⚠️'
const ICON_SKIPPED = '⏩'
const ICON_SUCCESS = '✔'

const STATUS_ICON = {
  failure: ICON_FAILURE,
  interrupted: ICON_INTERRUPTED,
  skipped: ICON_SKIPPED,
  success: ICON_SUCCESS,
}

const TITLE_BY_STATUS = {
  failure: n => `${n} Failure${n === 1 ? '' : 's'}`,
  interrupted: n => `${n} Interrupted`,
  skipped: n => `${n} Skipped`,
  success: n => `${n} Success${n === 1 ? '' : 'es'}`,
}

// ===================================================================

export function ifCond(v1, operator, v2, options) {
  switch (operator) {
    case '===':
      return v1 === v2 ? options.fn(this) : options.inverse(this)
    case '!==':
      return v1 !== v2 ? options.fn(this) : options.inverse(this)
    case '<':
      return v1 < v2 ? options.fn(this) : options.inverse(this)
    case '<=':
      return v1 <= v2 ? options.fn(this) : options.inverse(this)
    case '>':
      return v1 > v2 ? options.fn(this) : options.inverse(this)
    case '>=':
      return v1 >= v2 ? options.fn(this) : options.inverse(this)
    case '&&':
      return v1 && v2 ? options.fn(this) : options.inverse(this)
    case '||':
      return v1 || v2 ? options.fn(this) : options.inverse(this)
    default:
      return options.inverse(this)
  }
}

export const formatDuration = milliseconds => moment.duration(milliseconds).humanize()

export const formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B',
  })

export const formatSpeed = (bytes, start, end) =>
  end - start > 0
    ? humanFormat((bytes * 1e3) / (end - start), {
        scale: 'binary',
        unit: 'B/s',
      })
    : 'N/A'

export const subtract = (a, b) => a - b

export const executeFunction = (fct, arg) => fct(arg)

// this could be a partial but it would be less clear
export const getIcon = status => STATUS_ICON[status]

// this could be a partial but it would be less clear
export function titleByStatus(status, tasks) {
  if (tasks && status in TITLE_BY_STATUS) {
    return TITLE_BY_STATUS[status](tasks.length)
  }
}
