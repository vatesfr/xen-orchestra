import BloomFilter from 'mnemonist/bloom-filter'
import forOwn from 'lodash/forOwn'
import iteratee from 'lodash/iteratee'

const BLOOM_FILTER_CAPACITY = 50

export default class Subscriptions {
  constructor(app) {
    this._app = app

    this._permCacheByUser = { __proto__: null }
    this._objCacheBySession = { __proto__: null }
    this._predicatesBySession = { __proto__: null }
  }

  async subscribe(sessionId, userId, filter) {
    const predicatesBySession = this._predicatesBySession
    const predicates =
      predicatesBySession[sessionId] ??
      (predicatesBySession[sessionId] = { __proto__: null })

    const subscriptionId = Math.random()
      .toString(36)
      .slice(2)
    const predicate = iteratee(filter)
    predicates[subscriptionId] = predicate

    const objCacheBySession = this._objCacheBySession
    const objCache =
      objCacheBySession[sessionId] ??
      (objCacheBySession[sessionId] = { __proto__: null })

    const objects = this.getObjects()
    const ids = Object.keys(objects)
    await Promise.all(
      ids.map(async id => {
        if (!(await this.hasPermissions(userId, [[id, 'view']]))) {
          // user cannot see this object
          return
        }

        const cache =
          objCache[id] ??
          (objCache[id] = new BloomFilter(BLOOM_FILTER_CAPACITY))
        cache.add(subscriptionId)
      })
    )

    return subscriptionId
  }

  unsubscribe(sessionId, userId, subscriptionId) {
    const predicates = this._predicatesBySession[sessionId]
    if (predicates === undefined || !(subscriptionId in predicates)) {
      return
    }
    delete predicates[subscriptionId]

    const objCache = this._objCacheBySession[sessionId]
    forOwn(objCache, (cache, id) => {
      if (!cache.test(subscriptionId)) {
        // not handled by this subscription
        return
      }

      const object = this.getObject(id)
      cache = objCache[id] = new BloomFilter(BLOOM_FILTER_CAPACITY)
      forOwn(predicates, (predicate, subscriptionId) => {
        if (predicate(object)) {
          cache.add(subscriptionId)
        }
      })
    })
  }
}
