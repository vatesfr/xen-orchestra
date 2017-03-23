import Component from 'base-component'
import cookies from 'cookies-js'
import DocumentTitle from 'react-document-title'
import Icon from 'icon'
import isArray from 'lodash/isArray'
import map from 'lodash/map'
import React from 'react'
import Shortcuts from 'shortcuts'
import themes from 'themes'
import _, { IntlProvider } from 'intl'
import { blockXoaAccess } from 'xoa-updater'
import { connectStore, routes } from 'utils'
import { Notification } from 'notification'
import { ShortcutManager } from 'react-shortcuts'
import { ThemeProvider } from 'styled-components'
import { TooltipViewer } from 'tooltip'
import { Container, Row, Col } from 'grid'
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
import Xosan from './xosan'

import keymap, { help } from '../keymap'

const shortcutManager = new ShortcutManager(keymap)

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
  'xoa-update': XoaUpdates,
  'xosan': Xosan
})
@connectStore((state) => {
  return {
    trial: state.xoaTrialState,
    signedUp: !!state.user
  }
})
export default class XoApp extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }
  static childContextTypes = {
    shortcuts: React.PropTypes.object.isRequired
  }
  getChildContext = () => ({ shortcuts: shortcutManager })

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

  _shortcutsHandler = (command, event) => {
    event.preventDefault()
    switch (command) {
      case 'GO_TO_HOSTS':
        this.context.router.push('home?t=host')
        break
      case 'GO_TO_POOLS':
        this.context.router.push('home?t=pool')
        break
      case 'GO_TO_VMS':
        this.context.router.push('home?t=VM')
        break
      case 'GO_TO_SRS':
        this.context.router.push('home?t=SR')
        break
      case 'CREATE_VM':
        this.context.router.push('vms/new')
        break
      case 'UNFOCUS':
        if (event.target.tagName === 'INPUT') {
          event.target.blur()
        }
        break
      case 'HELP':
        alert(
          <span><Icon icon='shortcuts' />{' '}{_('shortcutModalTitle')}</span>,
          <Container>
            {map(help, (context, contextKey) => context.name && [
              <Row className='mt-1' key={contextKey}>
                <Col>
                  <h4>{context.name}</h4>
                </Col>
              </Row>,
              ...map(context.shortcuts, ({ message, keys }, key) => message &&
                <Row key={`${contextKey}_${key}`}>
                  <Col size={2} className='text-xs-right'>
                    <strong>
                      {isArray(keys) ? keys[0] : keys}
                    </strong>
                  </Col>
                  <Col size={10}>{message}</Col>
                </Row>
              )
            ])}
          </Container>
        )
        break
    }
  }

  render () {
    const { signedUp, trial } = this.props
    const blocked = signedUp && blockXoaAccess(trial) // If we are under expired or unstable trial (signed up only)

    return <IntlProvider>
      <ThemeProvider theme={themes.base}>
        <DocumentTitle title='Xen Orchestra'>
          <div style={CONTAINER_STYLE}>
            <Shortcuts name='XoApp' handler={this._shortcutsHandler} targetNodeSelector='body' stopPropagation={false} />
            <Menu ref='menu' />
            <div ref='bodyWrapper' style={BODY_WRAPPER_STYLE}>
              <div style={BODY_STYLE}>
                {blocked
                  ? <XoaUpdates />
                  : signedUp ? this.props.children : <p>Still loading</p>}
              </div>
            </div>
            <Modal />
            <Notification />
            <TooltipViewer />
          </div>
        </DocumentTitle>
      </ThemeProvider>
    </IntlProvider>
  }
}
