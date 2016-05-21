import { routes } from 'utils'

import Admin from './admin'
import Dashboard from './dashboard'

const Settings = routes('dashboard', {
  admin: Admin,
  dashboard: Dashboard
})(
  ({ children }) => children
)

export default Settings
