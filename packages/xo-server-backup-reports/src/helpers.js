import Handlebars from 'handlebars'
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
  failure: n => `## ${n} Failure${n === 1 ? '' : 's'}`,
  interrupted: n => `## ${n} Interrupted`,
  skipped: n => `## ${n} Skipped`,
  success: n => `## ${n} Success${n === 1 ? '' : 'es'}`,
}

// ===================================================================

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
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
})

Handlebars.registerHelper('formatDuration', milliseconds => moment.duration(milliseconds).humanize())

const formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B',
  })
Handlebars.registerHelper('formatSize', formatSize)

const formatSpeed = (bytes, milliseconds) =>
  milliseconds > 0
    ? humanFormat((bytes * 1e3) / milliseconds, {
        scale: 'binary',
        unit: 'B/s',
      })
    : 'N/A'
Handlebars.registerHelper('formatSpeed', (bytes, start, end) => formatSpeed(bytes, end - start))

Handlebars.registerHelper('subtract', (a, b) => a - b)

Handlebars.registerHelper('executeFunction', (fct, arg) => fct(arg))

// this could be a partial but it would be less clear
Handlebars.registerHelper('getIcon', status => STATUS_ICON[status])

// this could be a partial but it would be less clear
Handlebars.registerHelper('titleByStatus', function (status) {
  if (this && status in TITLE_BY_STATUS) {
    return TITLE_BY_STATUS[status](this.length)
  }
})
