import { parse, raw, Scale } from 'human-format'

const scale = Scale.create(['B', 'KiB', 'MiB', 'GiB', 'TiB'], 1024)

export const formatSizeRaw = (bytes: number | undefined, decimals: number) => {
  if (bytes === undefined) {
    return undefined
  }

  return raw(bytes, { maxDecimals: decimals, scale })
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
