import assign from 'lodash.assign'
import {BaseError} from 'make-error'

import {
  createRawObject,
  forEach
} from './utils'

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

export function _computeCrossProduct (items, productCb, extractValueMap = {}) {
  const upstreamValues = []
  const itemsCopy = items.slice()
  const item = itemsCopy.pop()
  const values = extractValueMap[item.type] && extractValueMap[item.type](item) || item
  forEach(values, value => {
    if (itemsCopy.length) {
      let downstreamValues = _computeCrossProduct(itemsCopy, productCb, extractValueMap)
      forEach(downstreamValues, downstreamValue => {
        upstreamValues.push(productCb(value, downstreamValue))
      })
    } else {
      upstreamValues.push(value)
    }
  })
  return upstreamValues
}

export default class JobExecutor {
  constructor (xo) {
    this.xo = xo
    this._extractValueCb = {
      'set': items => items.values
    }

    // The logger is not available until Xo has started.
    xo.on('start', () => xo.getLogger('jobs').then(logger => {
      this._logger = logger
    }))
  }

  async exec (job) {
    const runJobId = this._logger.notice(`Starting execution of ${job.id}.`, {
      event: 'job.start',
      userId: job.userId,
      jobId: job.id,
      key: job.key
    })

    try {
      if (job.type === 'call') {
        const execStatus = await this._execCall(job, runJobId)

        this.xo.emit('job:terminated', execStatus)
      } else {
        throw new UnsupportedJobType(job)
      }

      this._logger.notice(`Execution terminated for ${job.id}.`, {
        event: 'job.end',
        runJobId
      })
    } catch (e) {
      this._logger.error(`The execution of ${job.id} has failed.`, {
        event: 'job.end',
        runJobId,
        error: e
      })
    }
  }

  async _execCall (job, runJobId) {
    let paramsFlatVector

    if (job.paramsVector) {
      if (job.paramsVector.type === 'crossProduct') {
        paramsFlatVector = _computeCrossProduct(job.paramsVector.items, productParams, this._extractValueCb)
      } else {
        throw new UnsupportedVectorType(job.paramsVector)
      }
    } else {
      paramsFlatVector = [{}] // One call with no parameters
    }

    const connection = this.xo.createUserConnection()
    const promises = []

    connection.set('user_id', job.userId)

    const execStatus = {
      runJobId,
      start: Date.now(),
      calls: {}
    }

    forEach(paramsFlatVector, params => {
      const runCallId = this._logger.notice(`Starting ${job.method} call. (${job.id})`, {
        event: 'jobCall.start',
        runJobId,
        method: job.method,
        params
      })

      const call = execStatus.calls[runCallId] = {
        method: job.method,
        params,
        start: Date.now()
      }

      promises.push(
        this.xo.api.call(connection, job.method, assign({}, params)).then(
          value => {
            this._logger.notice(`Call ${job.method} (${runCallId}) is a success. (${job.id})`, {
              event: 'jobCall.end',
              runJobId,
              runCallId,
              returnedValue: value
            })

            call.returnedValue = value
            call.end = Date.now()
          },
          reason => {
            this._logger.notice(`Call ${job.method} (${runCallId}) has failed. (${job.id})`, {
              event: 'jobCall.end',
              runJobId,
              runCallId,
              error: reason
            })

            call.error = reason
            call.end = Date.now()
          }
        )
      )
    })

    connection.close()
    await Promise.all(promises)
    execStatus.end = Date.now()

    return execStatus
  }
}
