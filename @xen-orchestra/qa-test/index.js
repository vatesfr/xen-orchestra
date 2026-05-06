import { createLogger } from '@xen-orchestra/log'
import { DispatchClient } from './client/dispatchClient.js'
import { formatDuration } from './utils/index.js'

const log = createLogger('xo:qa-test')

// Load environment variables
try {
  process.loadEnvFile('.env')
} catch (error) {
  log.warn('No .env file found, using environment variables')
}

/**
 * Main test function - Infrastructure connectivity test
 */
async function main() {
  log.debug('XO QA Test Suite - Infrastructure Test')

  const startTime = Date.now()
  const dispatchClient = new DispatchClient()

  try {
    log.debug('Testing XenOrchestra connections')
    await dispatchClient.initialize()

    log.debug('Testing WebSocket connection')
    const serverInfo = await dispatchClient.getServerInfo()
    log.debug('server version', { version: serverInfo || 'Unknown' })

    log.debug('Testing REST API connection')
    const restConnected = dispatchClient.isConnected()
    log.debug('REST API status', { connected: restConnected })

    const duration = formatDuration(Date.now() - startTime)
    log.debug('Infrastructure test completed successfully', { duration })
  } catch (error) {
    const duration = formatDuration(Date.now() - startTime)
    log.warn('Infrastructure test failed', { duration, error: error.message })
    process.exit(1) // eslint-disable-line n/no-process-exit
  } finally {
    await dispatchClient.close()
  }
}

main().catch(error => {
  log.warn('Unexpected error', { error: error.message })
  process.exit(1) // eslint-disable-line n/no-process-exit
})
