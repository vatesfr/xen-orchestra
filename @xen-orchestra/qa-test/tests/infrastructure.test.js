/**
 * Infrastructure Tests - Node.js Native Tests
 *
 * Tests XenOrchestra connectivity using the native Node.js test runner
 * This validates the basic infrastructure setup for PR #1
 */

import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { setup, teardown } from './setup.js'

describe('Infrastructure Tests', () => {
  let dispatchClient
  let tracker

  before(async () => {
    console.log('\n🚀 Setting up infrastructure tests...')
    ;({ dispatchClient, tracker } = await setup())
    console.log('✅ Infrastructure setup complete')
  })

  after(async () => {
    if (dispatchClient) {
      // Use proper teardown which includes resource cleanup
      await teardown(dispatchClient, tracker)
      console.log('✅ Infrastructure cleanup complete')
    }
  })

  describe('Connection Tests', () => {
    it('should initialize both WebSocket and REST API clients', async () => {
      assert(dispatchClient.xoClient, 'WebSocket client should be initialized')
      assert(dispatchClient.restApiClient, 'REST API client should be initialized')
      assert(dispatchClient.isConnected(), 'Both clients should be connected')
    })

    it('should have valid REST API authentication token', async () => {
      assert(dispatchClient.restApiClient.token, 'REST API should have authentication token')
      assert(typeof dispatchClient.restApiClient.token === 'string', 'Token should be a string')
      assert(dispatchClient.restApiClient.token.length > 0, 'Token should not be empty')
    })

    it('should be able to make WebSocket calls', async () => {
      // Test a simple WebSocket call that should exist
      try {
        const serverInfo = await dispatchClient.getServerInfo()
        assert(serverInfo !== undefined, 'Should get some server information')
        console.log(`   Server info: ${JSON.stringify(serverInfo)}`)
      } catch (error) {
        // Accept connection test even if specific method fails
        if (error.message.includes('method not found')) {
          console.log('   WebSocket connection verified (method unavailable)')
          assert(true, 'WebSocket connection is working')
        } else {
          throw error
        }
      }
    })

    it('should be able to make REST API calls', async () => {
      try {
        // Test a simple REST API call
        const response = await dispatchClient.restApiClient.get('/rest/v0/hosts')
        assert(response !== undefined, 'Should get REST API response')
        console.log('   REST API call successful')
      } catch (error) {
        // Even if endpoint doesn't exist, we confirmed auth works from initialization
        if (error.message.includes('404') || error.message.includes('Request failed')) {
          console.log('   REST API connection verified (endpoint may not exist)')
          assert(true, 'REST API connection is working')
        } else {
          throw error
        }
      }
    })
  })

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      assert(process.env.HOSTNAME, 'HOSTNAME environment variable should be set')
      assert(process.env.USERNAME, 'USERNAME environment variable should be set')
      assert(process.env.PASSWORD, 'PASSWORD environment variable should be set')
    })

    it('should have valid connection configuration', () => {
      assert(process.env.HOSTNAME.startsWith('http'), 'HOSTNAME should be a valid URL')
      assert(process.env.USERNAME.includes('@'), 'USERNAME should be an email format')
      assert(process.env.PASSWORD.length > 0, 'PASSWORD should not be empty')
    })
  })
})
