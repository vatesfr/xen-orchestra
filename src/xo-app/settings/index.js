import { routes } from 'utils'

import Plugins from './plugins'
import Servers from './servers'

const Settings = routes('settings', {
  plugins: Plugins,
  servers: Servers
})(
  ({ children }) => children
)

export default Settings
