import React, {
  Component
} from 'react'
import { IntlProvider } from 'messages'
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
import Header from './header'
import Home from './home'
import Host from './host'
import HostHeader from './host/header'
import Menu from './menu'
import Modal from 'modal'
import New from './new'
import { Notification } from 'notification'
import Settings from './settings'
import Vm from './vm'
import VmHeader from './vm/header'

const makeHeaderRoutes = (content, header) => ({
  ...content.route,
  components: { content, header }
})

@routes('home', {
  about: About,
  backup: Backup,
  dashboard: Dashboard,
  home: Home,
  'hosts/:id': makeHeaderRoutes(Host, HostHeader),
  new: New,
  settings: Settings,
  'vms/:id': makeHeaderRoutes(Vm, VmHeader)
})
@connectStore([
  'user'
])
@propTypes({
  children: propTypes.node,
  header: propTypes.node,
  content: propTypes.node
})
export default class XoApp extends Component {
  componentDidMount () {
    this.refs.body.style.minHeight = this.refs.menu.getWrappedInstance().height + 'px'
  }
  render () {
    const {
      children,
      header,
      content
    } = this.props

    return <IntlProvider>
      <div className='xo-main'>
        <Modal />
        <Notification />
        <Menu ref='menu' />
        <div className='xo-body' ref='body'>
          {children
            ? <div className='xo-content'>
              {children}
            </div>
            : [
              <Header key='header'>
                {header}
              </Header>,
              <div key='content' className='xo-content'>
                {content}
              </div>
            ]
          }
        </div>
      </div>
    </IntlProvider>
  }
}
