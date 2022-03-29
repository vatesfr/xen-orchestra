import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import filter from 'lodash/filter.js'
import isEmpty from 'lodash/isEmpty.js'
import map from 'lodash/map.js'
import mapValues from 'lodash/mapValues.js'
import { createPredicate } from 'value-matcher'
import { timeout } from 'promise-toolbox'

import { crossProduct } from '../../math.mjs'
import { serializeError, thunkToArray } from '../../utils.mjs'

// ===================================================================

const paramsVectorActionsMap = {
  extractProperties({ mapping, value }) {
    return mapValues(mapping, key => value[key])
  },
  crossProduct({ items }) {
    return thunkToArray(crossProduct(map(items, value => resolveParamsVector.call(this, value))))
  },
  fetchObjects({ pattern }) {
    const objects = filter(this.getObjects(), createPredicate(pattern))
    if (isEmpty(objects)) {
      throw new Error('no objects match this pattern')
    }
    return objects
  },
  map({ collection, iteratee, paramName = 'value' }) {
    return map(resolveParamsVector.call(this, collection), value => {
      return resolveParamsVector.call(this, {
        ...iteratee,
        [paramName]: value,
      })
    })
  },
  set: ({ values }) => values,
}

export function resolveParamsVector(paramsVector) {
  const visitor = paramsVectorActionsMap[paramsVector.type]
  if (!visitor) {
    throw new Error(`Unsupported function '${paramsVector.type}'.`)
  }

  return visitor.call(this, paramsVector)
}

// ===================================================================

export default async function executeJobCall({ app, job, logger, runJobId, schedule, connection }) {
  const { paramsVector } = job
  const paramsFlatVector = paramsVector ? resolveParamsVector.call(app, paramsVector) : [{}] // One call with no parameters

  const execStatus = {
    calls: {},
    runJobId,
    start: Date.now(),
    timezone: schedule !== undefined ? schedule.timezone : undefined,
  }

  await asyncMapSettled(paramsFlatVector, params => {
    const runCallId = logger.notice(`Starting ${job.method} call. (${job.id})`, {
      event: 'jobCall.start',
      runJobId,
      method: job.method,
      params,
    })

    const call = (execStatus.calls[runCallId] = {
      method: job.method,
      params,
      start: Date.now(),
    })
    let promise = app.callApiMethod(connection, job.method, Object.assign({}, params))
    if (job.timeout) {
      promise = promise::timeout(job.timeout)
    }

    return promise.then(
      value => {
        logger.notice(`Call ${job.method} (${runCallId}) is a success. (${job.id})`, {
          event: 'jobCall.end',
          runJobId,
          runCallId,
          returnedValue: value,
        })

        call.returnedValue = value
        call.end = Date.now()
      },
      reason => {
        logger.notice(`Call ${job.method} (${runCallId}) has failed. (${job.id})`, {
          event: 'jobCall.end',
          runJobId,
          runCallId,
          error: serializeError(reason),
        })

        call.error = reason
        call.end = Date.now()
      }
    )
  })

  execStatus.end = Date.now()

  return execStatus
}
