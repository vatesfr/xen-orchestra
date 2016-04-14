import { routes } from 'utils'

import Servers from './servers'

const Settings = routes('servers', [
  { ...Servers.route, path: 'servers' }
])(
  ({ children }) => children
)

export default Settings
