import { routes } from 'utils'

import Plugins from './plugins'
import Remotes from './remotes'
import Servers from './servers'

const Settings = routes('servers', {
  plugins: Plugins,
  remotes: Remotes,
  servers: Servers
})(
  ({ children }) => children
)

export default Settings
