import { describe, it } from 'node:test'
import { strict as assert } from 'assert'

import guessAwsRegion from './_guessAwsRegion.js'

describe('guessAwsRegion', () => {
  it('should return region from AWS URL', async () => {
    const region = guessAwsRegion('s3.test-region.amazonaws.com')

    assert.equal(region, 'test-region')
  })

  it('should return default region if none is found is AWS URL', async () => {
    const region = guessAwsRegion('s3.amazonaws.com')

    assert.equal(region, 'us-east-1')
  })
})
