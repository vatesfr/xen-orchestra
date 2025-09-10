import { raw, Scale, type Info } from 'human-format'

const scale = Scale.create(['B/s', 'KiB/s', 'MiB/s', 'GiB/s', 'TiB/s'], 1024)

export function formatSpeedRaw(
  bytes: number,
  milliseconds: number = 1000
): Info<Scale<'B/s' | 'KiB/s' | 'MiB/s' | 'GiB/s' | 'TiB/s'>> {
  return raw((bytes * 1e3) / milliseconds, {
    scale,
  })
}
