import { routes } from 'utils'

import Overview from './overview'
import Health from './health'

const Dashboard = routes('overview', {
  health: Health,
  overview: Overview
})(
  ({ children }) => children
)

export default Dashboard
