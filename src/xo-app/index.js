import React, {
  Component
} from 'react'
// import {
//   keyHandler
// } from 'react-key-handler'
import {
  connectStore,
  propTypes,
  routes
} from 'utils'

import About from './about'
import Dashboard from './dashboard'
import Header from './header'
import Home from './home'
import Host from './host'
import Menu from './menu'
import Settings from './settings'
import Vm from './vm'
import VmHeader from './vm/header'

const makeHeaderRoutes = (content, header) => ({
  ...content.route,
  components: { content, header }
})

@routes('home', {
  about: About,
  dashboard: Dashboard,
  home: Home,
  'hosts/:id': Host,
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
  render () {
    const {
      children,
      header,
      content
    } = this.props

    return <div className='xo-main'>
      <Menu />
      <div className='xo-body' ref={(ref) => ref && (ref.style.minHeight = document.getElementById('xo-menu-content').offsetHeight + 'px')}>
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
  }
}
