import { routes } from 'utils'

import Acls from './acls'
import Groups from './groups'
import Plugins from './plugins'
import Remotes from './remotes'
import Servers from './servers'
import Users from './users'

const Settings = routes('servers', {
  acls: Acls,
  groups: Groups,
  plugins: Plugins,
  remotes: Remotes,
  servers: Servers,
  users: Users
})(
  ({ children }) => children
)

export default Settings
