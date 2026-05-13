import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findPool, printUsage } from './ssh-cli.mjs'

const POOLS = [
  { id: 'aaaa-bbbb-cccc-dddd', host: '192.168.1.1', username: 'root', password: 's3cr3t', label: 'prod-pool' },
  { id: 'eeee-ffff-0000-1111', host: '10.0.0.1', username: 'root', password: 'p4ssw0rd', label: 'dev-pool' },
]

test('findPool matches by UUID', () => {
  const result = findPool(POOLS, 'aaaa-bbbb-cccc-dddd')
  assert.equal(result?.id, 'aaaa-bbbb-cccc-dddd')
})

test('findPool matches by master IP', () => {
  const result = findPool(POOLS, '10.0.0.1')
  assert.equal(result?.id, 'eeee-ffff-0000-1111')
})

test('findPool returns undefined for unknown input', () => {
  assert.equal(findPool(POOLS, 'unknown'), undefined)
  assert.equal(findPool(POOLS, ''), undefined)
  assert.equal(findPool([], 'anything'), undefined)
})

test('printUsage does not expose passwords', () => {
  const chunks = []
  const { write } = process.stdout
  process.stdout.write = chunk => {
    chunks.push(chunk)
    return true
  }
  try {
    printUsage(POOLS)
  } finally {
    process.stdout.write = write
  }

  const output = chunks.join('')
  assert.ok(!output.includes('s3cr3t'), 'password must not appear in output')
  assert.ok(!output.includes('p4ssw0rd'), 'password must not appear in output')
  assert.ok(output.includes('192.168.1.1'), 'master IP should appear in output')
  assert.ok(output.includes('prod-pool'), 'label should appear in output')
  assert.ok(output.includes('aaaa-bbbb-cccc-dddd'), 'UUID should appear in output')
})

test('printUsage handles empty pool list', () => {
  const chunks = []
  const { write } = process.stdout
  process.stdout.write = chunk => {
    chunks.push(chunk)
    return true
  }
  try {
    printUsage([])
  } finally {
    process.stdout.write = write
  }

  assert.ok(chunks.join('').includes('none'), 'should indicate no pools registered')
})
