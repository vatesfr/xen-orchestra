import { describe, it } from 'node:test'
import { strict as assert } from 'assert'

import { isInDir, relativeFromFile } from './path.js'

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

describe('isInDir()', function () {
  for (const [title, [args, expected]] of Object.entries({
    'the dir itself': [['/foo/bar', '/foo/bar'], true],
    'a direct child': [['/foo/bar/baz.vhd', '/foo/bar'], true],
    'a deep child': [['/foo/bar/baz/qux.vhd', '/foo/bar'], true],
    'a sibling with a longer name': [['/foo/bar-baz/qux.vhd', '/foo/bar'], false],
    'a sibling': [['/foo/baz/qux.vhd', '/foo/bar'], false],
    'the parent dir': [['/foo', '/foo/bar'], false],
    'a relative path': [['foo/bar/baz.vhd', '/foo/bar'], true],
    'a relative dir': [['/foo/bar/baz.vhd', 'foo/bar'], true],
    'a trailing slash on the dir': [['/foo/bar/baz.vhd', '/foo/bar/'], true],
    'duplicate slashes': [['//foo///bar//baz.vhd', '/foo/bar'], true],
    'a dot segment': [['/foo/bar/./baz.vhd', '/foo/bar'], true],
    'an escaping dot dot segment': [['/foo/bar/../baz.vhd', '/foo/bar'], false],
    'the root dir': [['/foo/bar.vhd', '/'], true],
  })) {
    it('works with ' + title, function () {
      assert.equal(isInDir(...args), expected)
    })
  }
})
