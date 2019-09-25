import appConf from 'app-conf'
import path from 'path'

/* eslint-env jest */

let config
export { config as default }

beforeAll(async () => {
  config = await appConf.load('xo-server-test', {
    appDir: path.join(__dirname, '..'),
  })
})
