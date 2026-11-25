import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import forEach from 'lodash/forEach.js'
import fromEvent from 'promise-toolbox/fromEvent'

import { Collection } from './collection'
import { Index } from './index'

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

describe('Index', function () {
  let col, byGroup
  const item1 = {
    id: '2ccb8a72-dc65-48e4-88fe-45ef541f2cba',
    group: 'foo',
  }
  const item2 = {
    id: '7d21dc51-4da8-4538-a2e9-dd6f4784eb76',
    group: 'bar',
  }
  const item3 = {
    id: '668c1274-4442-44a6-b99a-512188e0bb09',
    group: 'foo',
  }
  const item4 = {
    id: 'd90b7335-e540-4a44-ad22-c4baae9cd0a9',
  }

  beforeEach(function () {
    col = new Collection()
    forEach([item1, item2, item3, item4], item => {
      col.add(item)
    })

    byGroup = new Index('group')

    col.createIndex('byGroup', byGroup)

    return waitTicks()
  })

  it('works with existing items', function () {
    assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
      byGroup: {
        foo: {
          [item1.id]: item1,
          [item3.id]: item3,
        },
        bar: {
          [item2.id]: item2,
        },
      },
    })
  })

  it('works with added items', function () {
    const item5 = {
      id: '823b56c4-4b96-4f3a-9533-5d08177167ac',
      group: 'baz',
    }

    col.add(item5)

    return waitTicks().then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byGroup: {
          foo: {
            [item1.id]: item1,
            [item3.id]: item3,
          },
          bar: {
            [item2.id]: item2,
          },
          baz: {
            [item5.id]: item5,
          },
        },
      })
    })
  })

  it('works with updated items', function () {
    const item1bis = {
      id: item1.id,
      group: 'bar',
    }

    col.update(item1bis)

    return waitTicks().then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byGroup: {
          foo: {
            [item3.id]: item3,
          },
          bar: {
            [item1.id]: item1bis,
            [item2.id]: item2,
          },
        },
      })
    })
  })

  it('works with removed items', function () {
    col.remove(item2)

    return waitTicks().then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byGroup: {
          foo: {
            [item1.id]: item1,
            [item3.id]: item3,
          },
          bar: {},
        },
      })
    })
  })

  it('emits remove on the previous type when an item changes type', function () {
    const removed = []
    const updated = []
    byGroup.getEventEmitterByType('foo').on('remove', (_, prev) => removed.push(prev))
    byGroup.getEventEmitterByType('foo').on('update', value => updated.push(value))

    const item1bis = {
      id: item1.id,
      group: 'bar',
    }
    col.update(item1bis)

    return waitTicks().then(() => {
      assert.deepEqual(removed, [item1])
      assert.deepEqual(updated, [])
    })
  })

  it('emits remove on the previous type when an item no longer has a type', function () {
    const removed = []
    byGroup.getEventEmitterByType('foo').on('remove', (_, prev) => removed.push(prev))

    col.update({ id: item1.id })

    return waitTicks().then(() => {
      assert.deepEqual(removed, [item1])
    })
  })

  it('emits update, not remove, when an item keeps the same type', function () {
    const removed = []
    const updated = []
    const ee = byGroup.getEventEmitterByType('foo')
    ee.on('remove', (_, prev) => removed.push(prev))
    ee.on('update', (value, prev) => updated.push([value, prev]))

    const item1bis = {
      id: item1.id,
      group: 'foo',
      newProp: true,
    }
    col.update(item1bis)

    return waitTicks().then(() => {
      assert.deepEqual(removed, [])
      assert.deepEqual(updated, [[item1bis, item1]])
    })
  })

  it('correctly updates the value even if the same object has the same hash', function () {
    const item1bis = {
      id: item1.id,
      group: item1.group,
      newProp: true,
    }

    col.update(item1bis)

    return fromEvent(col, 'finish').then(() => {
      assert.deepEqual(JSON.parse(JSON.stringify(col.indexes)), {
        byGroup: {
          foo: {
            [item1.id]: item1bis,
            [item3.id]: item3,
          },
          bar: {
            [item2.id]: item2,
          },
        },
      })
    })
  })
})
