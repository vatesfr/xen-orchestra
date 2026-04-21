import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Request } from 'express'

import { makeObjectMapper } from './object-wrapper.helper.mjs'
import type { XoRecord } from '@vates/types'

const BASE_URL = '/rest/v0'

function makeRequest(path: string, fields?: string | string[]): Request {
  return {
    path,
    query: fields !== undefined ? { fields } : {},
  } as unknown as Request
}

const obj = { id: 'abc-123', name: 'test-vm', type: 'VM', power_state: 'Running' } as unknown as XoRecord

describe('makeObjectMapper()', () => {
  describe('no fields query param — returns URL string', () => {
    it('uses req.path when no path argument is given', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'))
      assert.equal(mapper(obj), '/rest/v0/vms/abc-123')
    })

    it('uses BASE_URL + string path when path argument is a string', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'), 'hosts')
      assert.equal(mapper(obj), `${BASE_URL}/hosts/abc-123`)
    })

    it('strips leading slash from string path argument', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'), '/hosts')
      assert.equal(mapper(obj), `${BASE_URL}/hosts/abc-123`)
    })

    it('strips trailing slash from req.path', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms/'))
      assert.equal(mapper(obj), '/rest/v0/vms/abc-123')
    })

    it('strips trailing slash from string path argument', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'), 'hosts/')
      assert.equal(mapper(obj), `${BASE_URL}/hosts/abc-123`)
    })

    it('uses the return value of the path function', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'), () => 'hosts')
      assert.equal(mapper(obj), `${BASE_URL}/hosts/abc-123`)
    })

    it('passes the mapped object to the path function', () => {
      let received: unknown
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'), object => {
        received = object
        return 'hosts'
      })
      mapper(obj)
      assert.equal(received, obj)
    })

    it('strips leading slash from path function return value', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'), () => '/hosts')
      assert.equal(mapper(obj), `${BASE_URL}/hosts/abc-123`)
    })

    it('falls back to URL string when fields is an array', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms', ['name', 'type']))
      assert.equal(mapper(obj), '/rest/v0/vms/abc-123')
    })

    it('coerces a numeric id to string in the URL', () => {
      const numObj = { id: 42, name: 'test' }
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms'))
      assert.equal(mapper(numObj as unknown as XoRecord), '/rest/v0/vms/42')
    })
  })

  describe('fields === "*" — returns full object with href', () => {
    it('spreads all object properties and adds href', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms', '*'))
      assert.deepEqual(mapper(obj), { ...obj, href: '/rest/v0/vms/abc-123' })
    })

    it('href uses BASE_URL + string path when path argument is given', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms', '*'), 'hosts')
      assert.deepEqual(mapper(obj), { ...obj, href: `${BASE_URL}/hosts/abc-123` })
    })
  })

  describe('fields is a comma-separated string — returns picked fields with href', () => {
    it('returns only the requested fields alongside href', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms', 'name,type'))
      assert.deepEqual(mapper(obj), { name: 'test-vm', type: 'VM', href: '/rest/v0/vms/abc-123' })
    })

    it('omits fields not present on the object', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms', 'name,nonexistent'))
      assert.deepEqual(mapper(obj), { name: 'test-vm', href: '/rest/v0/vms/abc-123' })
    })

    it('returns only href when fields is an empty string', () => {
      const mapper = makeObjectMapper(makeRequest('/rest/v0/vms', ''))
      assert.deepEqual(mapper(obj), { href: '/rest/v0/vms/abc-123' })
    })
  })
})
