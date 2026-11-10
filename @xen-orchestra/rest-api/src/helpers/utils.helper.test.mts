import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ApiError } from './error.helper.mjs'
import { limitAndFilterArray, sortObjects } from './utils.helper.mjs'

const ids = (array: { id: string }[]) => array.map(_ => _.id)

describe('sortObjects()', () => {
  const objects = [
    { id: 'a', name: 'charlie', size: 10 },
    { id: 'b', name: 'alpha', size: 2 },
    { id: 'c', size: 5 },
    { id: 'd', name: 'bravo', size: 10 },
    { id: 'e', name: null, size: 1 },
  ]

  it('returns the same array when sort is undefined', () => {
    assert.equal(sortObjects(objects, undefined), objects)
  })

  it('does not mutate the original array', () => {
    const original = ids(objects)
    sortObjects(objects, 'name')
    assert.deepEqual(ids(objects), original)
  })

  it('sorts strings in ascending order', () => {
    assert.deepEqual(ids(sortObjects(objects, 'name')), ['b', 'd', 'a', 'c', 'e'])
  })

  it('sorts in descending order with the "-" prefix', () => {
    assert.deepEqual(ids(sortObjects(objects, '-name')), ['a', 'd', 'b', 'c', 'e'])
  })

  it('sorts numbers numerically', () => {
    assert.deepEqual(ids(sortObjects(objects, 'size')), ['e', 'b', 'c', 'a', 'd'])
  })

  it('keeps the original order of equal values, in both directions', () => {
    assert.deepEqual(ids(sortObjects(objects, '-size')), ['a', 'd', 'c', 'b', 'e'])
  })

  it('keeps the original order when no object has the property', () => {
    assert.deepEqual(ids(sortObjects(objects, 'unknown')), ids(objects))
  })

  it('accepts property names with "$"', () => {
    const pools = [
      { id: 'a', $pool: 'p2' },
      { id: 'b', $pool: 'p1' },
    ]
    assert.deepEqual(ids(sortObjects(pools, '$pool')), ['b', 'a'])
  })

  it('sorts booleans, false first', () => {
    const vms = [
      { id: 'a', isTemplate: true },
      { id: 'b', isTemplate: false },
      { id: 'c' },
      { id: 'd', isTemplate: false },
    ]
    assert.deepEqual(ids(sortObjects(vms, 'isTemplate')), ['b', 'd', 'a', 'c'])
    assert.deepEqual(ids(sortObjects(vms, '-isTemplate')), ['a', 'b', 'd', 'c'])
  })

  it('handles NaN as missing', () => {
    const disks = [
      { id: 'a', size: NaN },
      { id: 'b', size: 2 },
      { id: 'c', size: 1 },
    ]
    assert.deepEqual(ids(sortObjects(disks, '-size')), ['b', 'c', 'a'])
  })

  for (const value of [{ a: 1 }, ['a'], () => {}, 1n]) {
    it(`throws a 400 on a non scalar value: ${typeof value}`, () => {
      // even a single object, which the comparator never sees
      assert.throws(
        () => sortObjects([{ id: 'a', value }], 'value'),
        (error: unknown) => error instanceof ApiError && error.status === 400
      )
    })
  }

  it('throws a 400 when values have different types', () => {
    const mixed = [{ id: 'a', value: 1 }, { id: 'b' }, { id: 'c', value: '1' }]
    assert.throws(
      () => sortObjects(mixed, 'value'),
      (error: unknown) => error instanceof ApiError && error.status === 400
    )
  })

  for (const sort of ['', '-', 'a.b', 'name,size', ' name', ['name'], 42]) {
    it(`throws a 400 for ${JSON.stringify(sort)}`, () => {
      assert.throws(
        () => sortObjects(objects, sort),
        (error: unknown) => error instanceof ApiError && error.status === 400
      )
    })
  }
})

describe('limitAndFilterArray()', () => {
  it('filters, then sorts, then limits', () => {
    const objects = [
      { id: 'a', size: 3 },
      { id: 'b', size: 1 },
      { id: 'c', size: 4 },
      { id: 'd', size: 2 },
    ]
    assert.deepEqual(ids(limitAndFilterArray(objects, { filter: 'size:>1', sort: '-size', limit: 2 })), ['c', 'a'])
  })
})
