import assign from 'lodash.assign'
import forEach from 'lodash.foreach'
import {BaseError} from 'make-error'

import {createRawObject} from './utils'

export class JobExecutorError extends BaseError {}
export class UnsupportedJobType extends JobExecutorError {
  constructor (job) {
    super('Unknown job type: ' + job.type)
  }
}
export class UnsupportedVectorType extends JobExecutorError {
  constructor (vector) {
    super('Unknown vector type: ' + vector.type)
  }
}

export const productParams = (...args) => {
  let product = createRawObject()
  assign(product, ...args)
  return product
}

export default class JobExecutor {
  constructor (xo, api) {
    this.xo = xo
    this.api = api
    this._extractValueCb = {
      'set': items => items.values
    }
  }

  exec (job) {
    if (job.type === 'call') {
      this._execCall(job.userId, job.method, job.paramsVector)
    } else {
      throw new UnsupportedJobType(job)
    }
  }

  _execCall (userId, method, paramsVector) {
    let paramsFlatVector
    if (paramsVector.type === 'crossProduct') {
      paramsFlatVector = this._computeCrossProduct(paramsVector.items, productParams, this._extractValueCb)
    } else {
      throw new UnsupportedVectorType(paramsVector)
    }
    const connection = this.xo.createUserConnection()
    connection.set('user_id', userId)
    forEach(paramsFlatVector, params => {
      this.api.call(connection, method, assign({}, params))
    })
    connection.close()
  }

  _computeCrossProduct (items, productCb, extractValueMap = {}) {
    const upstreamValues = []
    const itemsCopy = items.slice()
    const item = itemsCopy.pop()
    const values = extractValueMap[item.type] && extractValueMap[item.type](item) || item
    forEach(values, value => {
      if (itemsCopy.length) {
        let downstreamValues = this._computeCrossProduct(itemsCopy, productCb, extractValueMap)
        forEach(downstreamValues, downstreamValue => {
          upstreamValues.push(productCb(value, downstreamValue))
        })
      } else {
        upstreamValues.push(value)
      }
    })
    return upstreamValues
  }
}
