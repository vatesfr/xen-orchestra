import { parse, raw, Scale } from 'human-format'

const scale = Scale.create(['', 'KiB', 'MiB', 'GiB', 'TiB'], 1024)

export const formatSizeRaw = (bytes: number | undefined, decimals: number) => {
  if (bytes === undefined) {
    return undefined
  }

  const result = raw(bytes, { maxDecimals: decimals, scale })

  return { ...result, prefix: result.prefix === '' ? 'B' : result.prefix }
}

export const formatSizeParse = (size: number | undefined, unit?: string) => {
  if (size === undefined) {
    return undefined
  }

  let value = String(size)
  if (unit !== undefined) {
    value += ` ${unit}`
  }

  const result = parse(value, { scale })
  if (isNaN(result)) {
    console.error(`[formatSizeParse]: got ${result}, expected a number`)
    return undefined
  }

  return result
}
