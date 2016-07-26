import Component from 'base-component'
import cookies from 'cookies-js'
import React from 'react'
import _, { IntlProvider } from 'intl'
import { blockXoaAccess } from 'xoa-updater'
import { connectStore, routes } from 'utils'
import { Notification } from 'notification'
import { TooltipViewer } from 'tooltip'
// import {
//   keyHandler
// } from 'react-key-handler'

import About from './about'
import Backup from './backup'
import Dashboard from './dashboard'
import Home from './home'
import Host from './host'
import Jobs from './jobs'
import Menu from './menu'
import Modal, { alert } from 'modal'
import New from './new'
import NewVm from './new-vm'
import Pool from './pool'
import Self from './self'
import Settings from './settings'
import Sr from './sr'
import Tasks from './tasks'
import User from './user'
import Vm from './vm'
import VmImport from './vm-import'
import XoaUpdates from './xoa-updates'

const CONTAINER_STYLE = {
  display: 'flex',
  minHeight: '100vh',

  // FIXME: The size of `xo-main` matches the size of the window
  // thanks to the, flex growing feature.
  //
  // Therefore, when there is a scrollbar on the right side, `xo-main`
  // is too large (since the scrollbar uses a few, pixels) which makes
  // an almost useless horizontal scrollbar appear.
  overflow: 'hidden'
}
const BODY_WRAPPER_STYLE = {
  flex: 1,
  position: 'relative'
}
const BODY_STYLE = {
  height: '100%',
  left: 0,
  overflow: 'auto',
  position: 'absolute',
  top: 0,
  width: '100%'
}

@routes('home', {
  about: About,
  backup: Backup,
  dashboard: Dashboard,
  home: Home,
  'hosts/:id': Host,
  jobs: Jobs,
  new: New,
  'pools/:id': Pool,
  self: Self,
  settings: Settings,
  'srs/:id': Sr,
  tasks: Tasks,
  user: User,
  'vms/import': VmImport,
  'vms/new': NewVm,
  'vms/:id': Vm,
  'xoa-update': XoaUpdates
})
@connectStore((state) => {
  return {
    trial: state.xoaTrialState,
    signedUp: !!state.user
  }
})
export default class XoApp extends Component {
  displayOpenSourceDisclaimer () {
    const previousDisclaimer = cookies.get('previousDisclaimer')
    const now = Math.floor(Date.now() / 1e3)
    const oneWeekAgo = now - 7 * 24 * 3600
    if (!previousDisclaimer || previousDisclaimer < oneWeekAgo) {
      alert(_('disclaimerTitle'), <div>
        <p>{_('disclaimerText1')}</p>
        <p>{_('disclaimerText2')} <a href='https://xen-orchestra.com/#!/xoa?pk_campaign=xoa_source_upgrade&pk_kwd=ossmodal'>XOA (turnkey appliance)</a></p>
        <p>{_('disclaimerText3')}</p>
      </div>)
      cookies.set('previousDisclaimer', now)
    }
  }

  componentDidMount () {
    this.refs.bodyWrapper.style.minHeight = this.refs.menu.getWrappedInstance().height + 'px'
    if (+process.env.XOA_PLAN === 5) {
      this.displayOpenSourceDisclaimer()
    }
  }

  render () {
    const { signedUp, trial } = this.props
    const blocked = signedUp && blockXoaAccess(trial) // If we are under expired or unstable trial (signed up only)

    return <IntlProvider>
      <div style={CONTAINER_STYLE}>
        <Menu ref='menu' />
        <div ref='bodyWrapper' style={BODY_WRAPPER_STYLE}>
          <div style={BODY_STYLE}>
            {blocked ? <XoaUpdates /> : this.props.children}
          </div>
        </div>
        <TooltipViewer />
        <Modal />
        <Notification />
      </div>
    </IntlProvider>
  }
}
