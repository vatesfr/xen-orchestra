import { routes } from 'utils'

import Plugins from './plugins'
import Servers from './servers'

const Settings = routes('servers', {
  plugins: Plugins,
  servers: Servers
})(
  ({ children }) => children
)

export default Settings
