'use strict'

const { utcFormat, utcParse } = require('d3-time-format')

// Format a date in ISO 8601 in a safe way to be used in filenames
// (even on Windows).
exports.formatFilenameDate = utcFormat('%Y%m%dT%H%M%SZ')
exports.parseFilenameDate = utcParse('%Y%m%dT%H%M%SZ')
