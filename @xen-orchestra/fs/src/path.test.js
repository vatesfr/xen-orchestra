import { describe, it } from 'node:test'
import { strict as assert } from 'assert'

import { relativeFromFile } from './path.js'

describe('relativeFromFile()', function () {
  for (const [title, args] of Object.entries({
    'file absolute and path absolute': ['/foo/bar/file.vhd', '/foo/baz/path.vhd'],
    'file relative and path absolute': ['foo/bar/file.vhd', '/foo/baz/path.vhd'],
    'file absolute and path relative': ['/foo/bar/file.vhd', 'foo/baz/path.vhd'],
    'file relative and path relative': ['foo/bar/file.vhd', 'foo/baz/path.vhd'],
  })) {
    it('works with ' + title, function () {
      assert.equal(relativeFromFile(...args), '../baz/path.vhd')
    })
  }
})
