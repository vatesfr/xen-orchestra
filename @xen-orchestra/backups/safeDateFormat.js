// Format a date in ISO 8601 in a safe way to be used in filenames
// (even on Windows).
export const safeDateFormat = utcFormat('%Y%m%dT%H%M%SZ')

export const safeDateParse = utcParse('%Y%m%dT%H%M%SZ')
