import { routes } from 'utils'

import Overview from './overview'

const Dashboard = routes({
  onEnter: (state, replace) => {
    replace(`${state.location.pathname}/overview`)
  }
}, [
  { ...Overview.route, path: 'overview' }
])(
  ({ children }) => children
)

export default Dashboard
