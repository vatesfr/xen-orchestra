import React, {
  Component
} from 'react'
import { IntlProvider } from 'messages'
import { Notification } from 'notification'
// import {
//   keyHandler
// } from 'react-key-handler'
import {
  connectStore,
  propTypes,
  routes
} from 'utils'

import About from './about'
import Backup from './backup'
import Dashboard from './dashboard'
import Home from './home'
import Host from './host'
import Menu from './menu'
import Modal from 'modal'
import New from './new'
import Pool from './pool'
import Settings from './settings'
import User from './user'
import Vm from './vm'

@routes('home', {
  about: About,
  backup: Backup,
  dashboard: Dashboard,
  home: Home,
  'hosts/:id': Host,
  pool: Pool,
  'pools/:id': Pool,
  new: New,
  settings: Settings,
  user: User,
  'vms/:id': Vm
})
@connectStore([
  'user'
])
@propTypes({
  children: propTypes.node
})
export default class XoApp extends Component {
  componentDidMount () {
    this.refs.bodyWrapper.style.minHeight = this.refs.menu.getWrappedInstance().height + 'px'
  }
  render () {
    return <IntlProvider>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        /* FIXME: 'The size of `xo-main` matches the size of the window thanks to the',
         * flex growing feature.,
         * Therefore, when there is a scrollbar on the right side,,
         * `xo-main` is too large (since the scrollbar uses a few,
         * pixels) which makes an almost useless horizontal scrollbar appear.,
         */
        overflow: 'hidden'
      }}>
        <Menu ref='menu' />
        <div ref='bodyWrapper' style={{flex: '1', padding: '1em'}}>
          {this.props.children}
        </div>
        <Modal />
        <Notification />
      </div>
    </IntlProvider>
  }
}
