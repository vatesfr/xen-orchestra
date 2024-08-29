import format from 'human-format'

const scale = format.Scale.create(['', 'KiB', 'MiB', 'GiB', 'TiB'], 1024)

export const formatSizeRaw = (bytes: number | undefined, decimals: number) => {
  if (bytes === undefined) {
    return undefined
  }

  return format.raw(bytes, { maxDecimals: decimals, scale })
}
