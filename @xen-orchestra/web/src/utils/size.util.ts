import { Scale, raw } from 'human-format'

const scale = Scale.create(['', 'KiB', 'MiB', 'GiB', 'TiB'], 1024)

export const formatSizeRaw = (bytes: number | undefined, decimals: number) => {
  if (bytes === undefined) {
    return undefined
  }

  return raw(bytes, { maxDecimals: decimals, scale })
}
