'use strict'

const humanFormat = require('human-format')
const moment = require('moment-timezone')

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

exports.ifCond = function ifCond(v1, operator, v2, options) {
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

exports.formatDuration = milliseconds => moment.duration(milliseconds).humanize()

exports.formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B',
  })

exports.formatSpeed = (bytes, start, end) =>
  end - start > 0
    ? humanFormat((bytes * 1e3) / (end - start), {
        scale: 'binary',
        unit: 'B/s',
      })
    : 'N/A'

exports.subtract = (a, b) => a - b

exports.executeFunction = (fct, arg) => fct(arg)

// this could be a partial but it would be less clear
exports.getIcon = status => STATUS_ICON[status]

// this could be a partial but it would be less clear
exports.titleByStatus = function titleByStatus(status, tasks) {
  if (tasks && status in TITLE_BY_STATUS) {
    return TITLE_BY_STATUS[status](tasks.length)
  }
}
