import { DispatchClient } from './client/dispatchClient.js'
import { formatDuration } from './utils/index.js'

// Load environment variables
try {
  process.loadEnvFile('.env')
} catch (error) {
  console.warn('⚠️ No .env file found, using environment variables')
}

/**
 * Main test function - Infrastructure connectivity test
 */
async function main() {
  console.log('🚀 XO QA Test Suite - Infrastructure Test')
  console.log('='.repeat(50))

  const startTime = Date.now()
  const dispatchClient = new DispatchClient()

  try {
    // Test 1: Initialize connections
    console.log('1 - Testing XenOrchestra connections...')
    await dispatchClient.initialize()

    // Test 2: Verify WebSocket connection
    console.log('2 - Testing WebSocket connection...')
    const serverInfo = await dispatchClient.getServerInfo()
    console.log(`   Server version: ${serverInfo || 'Unknown'}`)

    // Test 3: Verify REST API connection
    console.log('3 - Testing REST API connection...')
    const restConnected = dispatchClient.isConnected()
    console.log(`   REST API status: ${restConnected ? '✅ Connected' : '❌ Disconnected'}`)

    const duration = formatDuration(Date.now() - startTime)
    console.log(`✅ Infrastructure test completed successfully in ${duration}`)
    console.log('🎉 XenOrchestra connectivity validated!')
  } catch (error) {
    const duration = formatDuration(Date.now() - startTime)
    console.error(`❌ Infrastructure test failed after ${duration}`)
    console.error(`Error: ${error.message}`)
    console.error('💡 Troubleshooting:')
    console.error('   - Check your .env file configuration')
    console.error('   - Verify XenOrchestra server is running')
    console.error('   - Confirm network connectivity')
    process.exit(1) // eslint-disable-line n/no-process-exit
  } finally {
    // Clean up connections
    await dispatchClient.close()
  }
}

// Run the infrastructure test
main().catch(error => {
  console.error('💥 Unexpected error:', error.message)
  process.exit(1) // eslint-disable-line n/no-process-exit
})
