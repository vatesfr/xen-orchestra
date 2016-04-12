import { routes } from 'utils'

import Servers from './servers'

const Settings = routes({
  onEnter: (state, replace) => {
    replace(`${state.location.pathname}/servers`)
  }
}, [
  { ...Servers.route, path: 'servers' }
])(
  ({ children }) => children
)

export default Settings
