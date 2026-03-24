import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { sortDisks, toTableRow, type DiskInfo } from '../commands/list.mjs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(uid: string, parentUid: string | null = null): DiskInfo & { ok: true } {
  return {
    ok: true,
    filename: `${uid}.vhd`,
    uid,
    sizeOnDisk: '1.00 GiB',
    virtualSize: '8.00 GiB',
    differencing: parentUid !== null,
    parentUid,
  }
}

function err(filename: string): DiskInfo & { ok: false } {
  return { ok: false, filename, error: 'disk header corrupted' }
}

function uids(disks: DiskInfo[]): (string | false)[] {
  return disks.map(d => d.ok && d.uid)
}

// ---------------------------------------------------------------------------
// sortDisks
// ---------------------------------------------------------------------------

describe('sortDisks', () => {
  test('empty list', () => {
    assert.deepStrictEqual(sortDisks([]), [])
  })

  test('single base disk', () => {
    assert.deepStrictEqual(uids(sortDisks([ok('a')])), ['a'])
  })

  test('base + child already in order', () => {
    assert.deepStrictEqual(uids(sortDisks([ok('a'), ok('b', 'a')])), ['a', 'b'])
  })

  test('child before parent in input gets reordered', () => {
    assert.deepStrictEqual(uids(sortDisks([ok('b', 'a'), ok('a')])), ['a', 'b'])
  })

  test('three-disk chain regardless of input order', () => {
    assert.deepStrictEqual(uids(sortDisks([ok('c', 'b'), ok('a'), ok('b', 'a')])), ['a', 'b', 'c'])
  })

  test('child with missing parent is treated as a root', () => {
    assert.deepStrictEqual(uids(sortDisks([ok('b', 'missing')])), ['b'])
  })

  test('multiple independent chains', () => {
    const result = uids(sortDisks([ok('b', 'a'), ok('d', 'c'), ok('a'), ok('c')]))
    // Each chain must be contiguous: a before b, c before d
    const ai = result.indexOf('a')
    const bi = result.indexOf('b')
    const ci = result.indexOf('c')
    const di = result.indexOf('d')
    assert.ok(ai < bi, 'a must come before b')
    assert.ok(ci < di, 'c must come before d')
    assert.ok(bi === ai + 1, 'b must follow immediately after a')
    assert.ok(di === ci + 1, 'd must follow immediately after c')
  })

  test('error disks are appended at the end', () => {
    const result = sortDisks([err('bad.vhd'), ok('a'), err('bad2.vhd')])
    const okCount = result.filter(d => d.ok).length
    const errCount = result.filter(d => !d.ok).length
    assert.strictEqual(okCount, 1)
    assert.strictEqual(errCount, 2)
    // All ok disks come before error disks
    const firstErr = result.findIndex(d => !d.ok)
    assert.ok(result.slice(0, firstErr).every(d => d.ok))
  })

  test('parent with multiple children: all children follow the parent directly', () => {
    const sorted = sortDisks([ok('c2', 'a'), ok('a'), ok('c1', 'a')])

    const parentIdx = sorted.findIndex(d => d.ok && d.uid === 'a')
    const c1Idx = sorted.findIndex(d => d.ok && d.uid === 'c1')
    const c2Idx = sorted.findIndex(d => d.ok && d.uid === 'c2')

    assert.notStrictEqual(parentIdx, -1)
    assert.notStrictEqual(c1Idx, -1)
    assert.notStrictEqual(c2Idx, -1)

    // Both children must occupy the two slots right after the parent
    const childIndices = [c1Idx, c2Idx].sort()
    assert.deepStrictEqual(
      childIndices,
      [parentIdx + 1, parentIdx + 2],
      'both children must follow the parent directly'
    )
  })
})

// ---------------------------------------------------------------------------
// toTableRow
// ---------------------------------------------------------------------------

describe('toTableRow', () => {
  test('base disk shows "(none)" in parent uid column', () => {
    const row = toTableRow(ok('a'), undefined)
    assert.strictEqual(row[5], '(none)')
  })

  test('differencing disk with no previous disk shows parentUid', () => {
    const row = toTableRow(ok('b', 'a'), undefined)
    assert.strictEqual(row[5], 'a')
  })

  test('differencing disk whose parent is not the previous row shows parentUid', () => {
    const row = toTableRow(ok('b', 'a'), ok('x'))
    assert.strictEqual(row[5], 'a')
  })

  test('differencing disk whose parent is immediately above shows ↑', () => {
    const row = toTableRow(ok('b', 'a'), ok('a'))
    assert.strictEqual(row[5], '↑')
  })

  test('error disk shows error message in second column', () => {
    const row = toTableRow(err('bad.vhd'), undefined)
    assert.ok(row[1].includes('error'))
    assert.ok(row[1].includes('disk header corrupted'))
  })

  test('differencing column shows "yes" for differencing disk', () => {
    assert.strictEqual(toTableRow(ok('b', 'a'), undefined)[4], 'yes')
  })

  test('differencing column shows "no" for base disk', () => {
    assert.strictEqual(toTableRow(ok('a'), undefined)[4], 'no')
  })

  test('parent with multiple children: at least one child shows parent UID instead of ↑', () => {
    const sorted = sortDisks([ok('c2', 'a'), ok('a'), ok('c1', 'a')])

    const rows = sorted.map((disk, i) => toTableRow(disk, sorted[i - 1]))

    // Find rows for the two children
    const childRows = rows.filter((_row, i) => {
      const d = sorted[i]
      return d.ok && (d.uid === 'c1' || d.uid === 'c2')
    })

    assert.strictEqual(childRows.length, 2, 'both child rows must be present')

    const arrowCount = childRows.filter(r => r[5] === '↑').length
    const uidCount = childRows.filter(r => r[5] === 'a').length

    assert.ok(arrowCount >= 1, 'at least one child should show ↑ (the one directly after parent)')
    assert.ok(uidCount >= 1, 'at least one child must show the parent UID instead of ↑')
  })
})
