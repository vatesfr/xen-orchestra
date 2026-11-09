import { isWritableSrOfPool } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { OTHER_POOL_ID } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'

describe('isWritableSrOfPool', () => {
  const sr = createSr()

  it('accepts a writable SR of the pool', () => {
    expect(isWritableSrOfPool(sr, sr.$pool)).toBe(true)
  })

  it.each([
    ['an ISO SR', createSr({ content_type: 'iso' }), sr.$pool],
    ['an SR without size', createSr({ size: 0 }), sr.$pool],
    ['an SR of another pool', sr, OTHER_POOL_ID],
    ['any SR while the pool is unknown', sr, undefined],
  ])('rejects %s', (_, candidate, poolId) => {
    expect(isWritableSrOfPool(candidate, poolId)).toBe(false)
  })
})
