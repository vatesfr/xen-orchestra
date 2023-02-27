import { strictEqual as assertEq } from 'node:assert'
import test from 'test'

import { TreeMap } from './_TreeMap.mjs'

test(function () {
  const tree = new TreeMap()

  assertEq(tree instanceof Map, true)

  assertEq(tree.set([0, 1], 'foo'), tree)

  assertEq(tree.has(0), true)
  assertEq(tree.has([0, 1]), true)

  assertEq(tree.get(0).get(1), 'foo')
  assertEq(tree.get([0, 1]), 'foo')

  assertEq(tree.delete([0, 1]), true)

  assertEq(tree.has(0), false)
  assertEq(tree.has([0, 1]), false)

  assertEq(tree.get(0), undefined)
  assertEq(tree.get([0, 1]), undefined)

  assertEq(tree.delete([0, 1]), false)
})
