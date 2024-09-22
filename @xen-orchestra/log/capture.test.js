'use strict'

const { beforeEach, describe, it } = require('node:test')
const { captureLogs, createCaptureTransport } = require('@xen-orchestra/log/capture')
const { configure } = require('@xen-orchestra/log/configure')
const { createLogger } = require('@xen-orchestra/log')
const { dedupe } = require('@xen-orchestra/log/dedupe')
const assert = require('node:assert/strict')

describe('capture log', () => {
  const logger = createLogger('test-logger')

  const logsTransportDefault = []
  const transportTest = message => {
    logsTransportDefault.push(message)
  }

  beforeEach(() => {
    configure(
      createCaptureTransport([
        {
          level: 'debug',
          transport: transportTest,
        },
      ])
    )

    logsTransportDefault.length = 0
  })

  it('should capture logs', async () => {
    const captureLog = []
    await captureLogs(
      log => {
        // every logs emitted in the async context of `fn` will arrive here
        //
        // do not emit logs in this function or this will create a loop.
        captureLog.push(log)
        // console.log(`[captureLog] ${JSON.stringify(log)}`)
        // console.log(`[captureLog]`, captureLog) // ${JSON.stringify(captureLog)}`)
      },
      async () => {
        logger.debug('synchronous logs are captured')

        setTimeout(() => {
          logger.debug('logs from asynchronous callbacks too')
        }, 50)

        await new Promise(resolve => setTimeout(resolve, 50))

        logger.debug('logs in async functions or promise chains too')

        // To escape capture, run code in `captureLogs` with `undefined`
        // as the first param
        captureLogs(undefined, () => {
          logger.debug('this log will not be captured')
        })

        // Returned value and error is forwarded by `captureLogs`
        return 'returned value'
      }
    )

    assert.equal(captureLog[0].message, 'synchronous logs are captured')
    assert.equal(captureLog[1].message, 'logs from asynchronous callbacks too')
    assert.equal(captureLog[2].message, 'logs in async functions or promise chains too')
    assert.ok(captureLog[3] === undefined, 'this log will not be captured')
    assert.equal(logsTransportDefault[0].message, 'this log will not be captured')
  })

  it('should not dedup logs', () => {
    configure(
      createCaptureTransport([
        {
          transport: transportTest,
        },
      ])
    )

    for (let i = 0; i < 3; i++) {
      logger.debug('this line should be logged 3 times')
    }
    assert.equal(logsTransportDefault.length, 3)
  })
  it('should dedup logs', () => {
    configure(
      createCaptureTransport([
        dedupe({
          timeout: 50, // without a defined timeout, the test will wait for 10 minutes
          transport: transportTest,
        }),
      ])
    )

    for (let i = 0; i < 3; i++) {
      logger.debug('this line should be logged only once')
    }
    assert.equal(logsTransportDefault.length, 1)
  })
})
