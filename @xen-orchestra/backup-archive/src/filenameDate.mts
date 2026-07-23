import { utcFormat, utcParse } from 'd3-time-format'

// Format a date in ISO 8601 in a safe way to be used in filenames
// (even on Windows).
export const formatFilenameDate = utcFormat('%Y%m%dT%H%M%SZ')
export const parseFilenameDate = utcParse('%Y%m%dT%H%M%SZ')
