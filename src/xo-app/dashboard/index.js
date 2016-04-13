import { routes } from 'utils'

import Overview from './overview'
import Health from './health'

const Dashboard = routes({
  onEnter: (state, replace) => {
    replace(`${state.location.pathname}/overview`)
  }
}, [
  { ...Overview.route, path: 'overview' },
  { ...Health.route, path: 'health' }
])(
  ({ children }) => children
)

export default Dashboard
