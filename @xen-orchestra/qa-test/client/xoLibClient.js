import Xo from 'xo-lib'

const XoConnection = Xo.default

/**
 * Creates and authenticates a WebSocket connection to XenOrchestra using xo-lib.
 *
 * This function establishes a persistent WebSocket connection to the XenOrchestra server
 * and handles authentication. The connection uses XenOrchestra's native JSON-RPC protocol
 * over WebSocket for efficient real-time communication.
 *
 * @param {Object} config - Connection configuration object
 * @param {string} config.xoUrl - XenOrchestra server URL (e.g., 'https://xo.example.com' or 'wss://xo.example.com')
 * @param {string} config.username - Username for authentication
 * @param {string} config.password - Password for authentication
 * @param {boolean} [config.allowUnauthorized=false] - Allow unauthorized SSL certificates (optional, use with caution)
 * @returns {Promise<Object>} Authenticated XO client instance with call() method for JSON-RPC calls
 * @throws {Error} If connection fails, authentication fails, or required parameters are missing
 */
export async function xoConnection(config) {
  // Extract and validate configuration parameters
  const { xoUrl, username, password } = config

  // Validate required parameters
  if (!xoUrl || !username || !password) {
    throw new Error('Missing required configuration: xoUrl, username, and password are required')
  }

  try {
    const xo = new XoConnection({ url: xoUrl })

    // Establish WebSocket connection
    await xo.open()

    // Authenticate with credentials
    await xo.signIn({ username, password })

    console.log(`🌐 Successfully connected to XenOrchestra at ${xoUrl}`)

    return xo
  } catch (error) {
    console.error(`❌ Failed to connect to XO server: ${error.message}`)
    throw new Error(`XO connection failed: ${error.message}`)
  }
}
