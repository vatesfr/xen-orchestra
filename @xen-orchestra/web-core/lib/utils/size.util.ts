import { parse, raw, Scale, type Info } from 'human-format'

const scale = Scale.create(['', 'KiB', 'MiB', 'GiB', 'TiB'], 1024)

export function formatSizeRaw(bytes: number, decimals: number): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
export function formatSizeRaw(bytes: undefined, decimals: number): undefined
export function formatSizeRaw(
  bytes: undefined | number,
  decimals: number
): undefined | Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
export function formatSizeRaw(
  bytes: number | undefined,
  decimals: number
): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>> | undefined {
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
