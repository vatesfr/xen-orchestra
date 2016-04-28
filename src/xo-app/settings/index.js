import { routes } from 'utils'

import Servers from './servers'

const Settings = routes('servers', {
  servers: Servers
})(
  ({ children }) => children
)

export default Settings
