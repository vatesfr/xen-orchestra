/* eslint-env jest */

import guessAwsRegion from './_guessAwsRegion.js'

describe('guessAwsRegion', () => {
  it('should return region from AWS URL', async () => {
    const region = guessAwsRegion('s3.test-region.amazonaws.com')

    expect(region).toBe('test-region')
  })

  it('should return default region if none is found is AWS URL', async () => {
    const region = guessAwsRegion('s3.amazonaws.com')

    expect(region).toBe('us-east-1')
  })
})
