// Copied from @xen-orchestra/xapi.
//
// `isDefaultTemplate` is a standalone one-liner, but `parseDateTime` lives in
// that package's index.mjs, which imports the `xen-api` client (undici, node
// streams) at module level. Both functions are pure; `d3-time-format` is
// browser-safe.

import { utcParse } from 'd3-time-format'

export const isDefaultTemplate = vmTpl => vmTpl.is_default_template || vmTpl.other_config.default_template === 'true'

const parseDateTimeHelper = utcParse('%Y%m%dT%H:%M:%S%Z')

export function parseDateTime(input) {
  const type = typeof input

  // If the value is a number, it is assumed to be a timestamp in seconds
  if (type === 'number') {
    return input || null
  }

  if (typeof input === 'string') {
    let date

    // Some dates like host.other_config.{agent_start_time,boot_time,rpm_patch_installation_time}
    // are already timestamps
    date = +input
    if (!Number.isNaN(date)) {
      return date || null
    }

    // This is the case when the date has been retrieved via the JSON-RPC or JSON in XML-RPC APIs.
    date = parseDateTimeHelper(input)
    if (date === null) {
      throw new RangeError(`unable to parse XAPI datetime ${JSON.stringify(input)}`)
    }
    input = date
  }

  // This is the case when the date has been retrieved using the XML-RPC API or parsed by the block above.
  if (input instanceof Date) {
    const msTimestamp = input.getTime()
    return msTimestamp === 0 ? null : Math.floor(msTimestamp / 1e3)
  }

  throw new TypeError('unsupported input ' + input)
}
