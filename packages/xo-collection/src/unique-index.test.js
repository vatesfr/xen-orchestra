import fromEvent from 'promise-toolbox/fromEvent'
import forEach from 'lodash/forEach.js'
import { Collection } from './collection'
import { UniqueIndex } from './unique-index'
import assert from 'assert'
import { describe, test, beforeEach } from 'node:test'

// ===================================================================

const waitTicks = (n = 2) => {
  const { nextTick } = process

  return new Promise(resolve => {
    ;(function waitNextTick() {
      // The first tick is handled by Promise#then()
      if (--n) {
        nextTick(waitNextTick)
      } else {
        resolve()
      }
    })()
  })
}

// ===================================================================

describe('UniqueIndex', function () {
  let col, byKey
  const item1 = {
    id: '2ccb8a72-dc65-48e4-88fe-45ef541f2cba',
    key: '036dee1b-9a3b-4fb5-be8a-4f535b355581',
  }
  const item2 = {
    id: '7d21dc51-4da8-4538-a2e9-dd6f4784eb76',
    key: '103cd893-d2cc-4d37-96fd-c259ad04c0d4',
  }
  const item3 = {
    id: '668c1274-4442-44a6-b99a-512188e0bb09',
  }

  beforeEach(function () {
    col = new Collection()
    forEach([item1, item2, item3], item => {
      col.add(item)
    })

    byKey = new UniqueIndex('key')
    col.createIndex('byKey', byKey)

    return waitTicks()
  })

  test('works with existing items', function () {
    assert.deepStrictEqual(JSON.parse(JSON.stringify(col.indexes)), {
      byKey: {
        [item1.key]: item1,
        [item2.key]: item2,
      },
    })
  })

  test('works with added items', function () {
    const item4 = {
      id: '823b56c4-4b96-4f3a-9533-5d08177167ac',
      key: '1437af14-429a-40db-8a51-8a2f5ed03201',
    }

    col.add(item4)

    return waitTicks().then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byKey: {
          [item1.key]: item1,
          [item2.key]: item2,
          [item4.key]: item4,
        },
      })
    })
  })

  test('works with updated items', function () {
    const item1bis = {
      id: item1.id,
      key: 'e03d4a3a-0331-4aca-97a2-016bbd43a29b',
    }

    col.update(item1bis)

    return waitTicks().then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byKey: {
          [item1bis.key]: item1bis,
          [item2.key]: item2,
        },
      })
    })
  })

  test('works with removed items', function () {
    col.remove(item2)

    return waitTicks().then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byKey: {
          [item1.key]: item1,
        },
      })
    })
  })

  test('correctly updates the value even if the same object has the same hash', function () {
    const item1bis = {
      id: item1.id,
      key: item1.key,
      newProp: true,
    }

    col.update(item1bis)

    return fromEvent(col, 'finish').then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byKey: {
          [item1.key]: item1bis,
          [item2.key]: item2,
        },
      })
    })
  })
})
