import { computeTransferSpeed } from '@/modules/backup-log/utils/xo-backup-log-transfer-speed.util.ts'

describe('computeTransferSpeed', () => {
  it('returns the transferred size per second', () => {
    expect(computeTransferSpeed(4_000, 1_000, 3_000)).toBe(2_000)
  })

  it('returns undefined for a transfer that has not ended', () => {
    expect(computeTransferSpeed(4_000, 1_000, undefined)).toBeUndefined()
  })

  it('returns undefined for a transfer that took no time', () => {
    expect(computeTransferSpeed(4_000, 1_000, 1_000)).toBeUndefined()
  })

  it('returns undefined for an end before the start', () => {
    expect(computeTransferSpeed(4_000, 2_000, 1_000)).toBeUndefined()
  })
})
