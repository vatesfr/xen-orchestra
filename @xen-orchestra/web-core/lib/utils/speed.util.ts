import { type Info, raw, Scale } from 'human-format'

const scale = Scale.create(['B/s', 'KiB/s', 'MiB/s', 'GiB/s', 'TiB/s'], 1024)

type formatSpeedOptions = {
  maxDecimals: number
  milliseconds?: number
}

export function formatSpeedRaw(
  bytes: number,
  { maxDecimals, milliseconds = 1000 }: formatSpeedOptions
): Info<Scale<'B/s' | 'KiB/s' | 'MiB/s' | 'GiB/s' | 'TiB/s'>> {
  return raw((bytes * 1e3) / milliseconds, {
    maxDecimals,
    scale,
  })
}

export function formatSpeed(bytesPerSecond: number): string {
  const { value, prefix } = formatSpeedRaw(bytesPerSecond, { maxDecimals: 2 })

  return `${value} ${prefix}`
}
