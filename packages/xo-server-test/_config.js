import appConf from 'app-conf'
import path from 'path'
import { before } from 'node:test'

let config
export { config as default }

before(async () => {
  config = await appConf.load('xo-server-test', {
    appDir: path.join(process.cwd(), '..'),
  })
})
