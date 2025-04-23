import Component from 'base-component'
import cookies from 'js-cookie'
import DocumentTitle from 'react-document-title'
import every from 'lodash/every'
import Icon from 'icon'
import Link from 'link'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import PropTypes from 'prop-types'
import React from 'react'
import Shortcuts from 'shortcuts'
import themes from 'themes'
import _, { IntlProvider } from 'intl'
// TODO: Replace all `getXoaPlan` by `getXoaPlan` from "xoa-plans"
import { addSubscriptions, connectStore, getXoaPlan, noop, routes } from 'utils'
import { blockXoaAccess, isTrialRunning } from 'xoa-updater'
import { checkXoa, clearXoaCheckCache, subscribeSelfLicenses } from 'xo'
import { forEach, groupBy, keyBy, pick } from 'lodash'
import { Host as HostItem } from 'render-xo-item'
import { Notification } from 'notification'
import { productId2Plan } from 'xoa-plans'
import { provideState } from 'reaclette'
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
import Hub from './hub'
import Jobs from './jobs'
import Menu from './menu'
import Modal, { alert, FormModal } from 'modal'
import New from './new'
import NewVm from './new-vm'
import Pool from './pool'
import Proxies from './proxies'
import Self from './self'
import Settings from './settings'
import Sr from './sr'
import Tasks from './tasks'
import User from './user'
import Vm from './vm'
import Xoa from './xoa'
import XoaUpdates from './xoa/update'
import Xostor from './xostor'
import Import from './import'

import keymap, { help } from '../keymap'
import Tooltip from '../common/tooltip'
import { createCollectionWrapper, createGetObjectsOfType } from '../common/selectors'
import { bindXcpngLicense, rebindLicense, subscribeXcpngLicenses, subscribeXostorLicenses } from '../common/xo'
import { SOURCES } from '../common/xoa-plans'
import { getLicenseNearExpiration } from '../common/xoa-updater'

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
  overflow: 'hidden',
}
const BODY_WRAPPER_STYLE = {
  flex: 1,
  position: 'relative',
}
const BODY_STYLE = {
  height: '100%',
  left: 0,
  overflow: 'auto',
  position: 'absolute',
  top: 0,
  width: '100%',
}

const WrapperIconPoolLicense = ({ children }) => (
  <a href='https://xcp-ng.com' rel='noreferrer noopener' target='_blank'>
    {children}
  </a>
)

export const ICON_POOL_LICENSE = {
  total: tooltip => (
    <Tooltip content={tooltip}>
      <WrapperIconPoolLicense>
        <Icon icon='pro-support' className='text-success' />
      </WrapperIconPoolLicense>
    </Tooltip>
  ),
  partial: () => (
    <WrapperIconPoolLicense>
      <Icon icon='alarm' className='text-warning' />
    </WrapperIconPoolLicense>
  ),
  any: () => (
    <WrapperIconPoolLicense>
      <Icon icon='alarm' className='text-warning' />
    </WrapperIconPoolLicense>
  ),
}

@routes('home', {
  about: About,
  backup: Backup,
  'backup-ng/*': {
    onEnter: ({ location }, replace) => replace(location.pathname.replace('/backup-ng', '/backup')),
  },
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
  'vms/new': NewVm,
  'vms/:id': Vm,
  xoa: Xoa,
  xostor: Xostor,
  import: Import,
  hub: Hub,
  proxies: Proxies,
})
@addSubscriptions({
  xcpLicenses: subscribeXcpngLicenses,
  xostorLicenses: subscribeXostorLicenses,
  selfLicences: subscribeSelfLicenses
})
@connectStore(state => {
  const getHosts = createGetObjectsOfType('host')
  const getXostors = createGetObjectsOfType('SR').filter([sr => sr.SR_type === 'linstor'])
  return {
    trial: state.xoaTrialState,
    registerNeeded: state.xoaUpdaterState === 'registerNeeded',
    signedUp: !!state.user,
    hosts: getHosts(state),
    xostors: getXostors(state),
  }
})
@provideState({
  initialState: () => ({ checkXoaCount: 0 }),
  effects: {
    async forceRefreshXoaStatus() {
      await clearXoaCheckCache()
      await this.effects.refreshXoaStatus()
    },
    refreshXoaStatus() {
      this.state.checkXoaCount += 1
    },
    async bindXcpngLicenses(_, xcpngLicensesByHost) {
      await Promise.all(
        map(xcpngLicensesByHost, ({ productId, id, boundObjectId }, hostId) =>
          boundObjectId !== undefined
            ? rebindLicense(productId, id, boundObjectId, hostId)
            : bindXcpngLicense(id, hostId)
        )
      )
    },
  },
  computed: {
    // In case an host have more than 1 license, it's an issue.
    // poolLicenseInfoByPoolId can be impacted because the license expiration check may not yield the right information.
    xcpngLicenseByBoundObjectId: (_, { xcpLicenses }) =>
      xcpLicenses === undefined ? undefined : keyBy(xcpLicenses, 'boundObjectId'),
    xostorLicensesByBoundObjectId: (_, { xostorLicenses }) =>
      xostorLicenses === undefined ? undefined : groupBy(xostorLicenses, 'boundObjectId'),
    xcpngLicenseById: (_, { xcpLicenses }) => keyBy(xcpLicenses, 'id'),
    hostsByPoolId: createCollectionWrapper((_, { hosts }) =>
      groupBy(
        map(hosts, host => pick(host, ['$poolId', 'id', 'version'])),
        '$poolId'
      )
    ),
    poolLicenseInfoByPoolId: ({ hostsByPoolId, xcpngLicenseByBoundObjectId }) => {
      const poolLicenseInfoByPoolId = {}

      forEach(hostsByPoolId, (hosts, poolId) => {
        const nHosts = hosts.length
        let earliestExpirationDate
        let nHostsUnderLicense = 0

        if (getXoaPlan() === SOURCES.name) {
          poolLicenseInfoByPoolId[poolId] = {
            nHostsUnderLicense,
            icon: () => <Icon icon='unknown-status' className='text-warning' />,
            nHosts,
          }
          return
        }

        for (const host of hosts) {
          const license = xcpngLicenseByBoundObjectId?.[host.id]
          if (license === undefined) {
            continue
          }
          license.expires = license.expires ?? Infinity

          if (license.expires > Date.now()) {
            nHostsUnderLicense++
            if (earliestExpirationDate === undefined || license.expires < earliestExpirationDate) {
              earliestExpirationDate = license.expires
            }
          }
        }

        const supportLevel = nHostsUnderLicense === 0 ? 'any' : nHostsUnderLicense === nHosts ? 'total' : 'partial'

        poolLicenseInfoByPoolId[poolId] = {
          earliestExpirationDate,
          icon: ICON_POOL_LICENSE[supportLevel],
          nHosts,
          nHostsUnderLicense,
          supportLevel,
        }
      })

      return poolLicenseInfoByPoolId
    },
    xoaStatus: {
      get({ checkXoaCount }) {
        // To avoid aggressive minification which would remove destructuration
        noop(checkXoaCount)
        return getXoaPlan() === 'Community' ? '' : checkXoa().catch(() => 'XOA status not available')
      },
      placeholder: '',
    },
    isXoaStatusOk: ({ xoaStatus }) => !xoaStatus.includes('✖'),
    areHostsVersionsEqualByPool: ({ hostsByPoolId }) =>
      mapValues(hostsByPoolId, hosts => every(hosts, host => host.version === hosts[0].version)),
    xostorLicenseInfoByXostorId: (
      { xcpngLicenseByBoundObjectId, xostorLicensesByBoundObjectId, hostsByPoolId },
      { xostors }
    ) => {
      if (xcpngLicenseByBoundObjectId === undefined || xostorLicensesByBoundObjectId === undefined) {
        return
      }
      const xostorLicenseInfoByXostorId = {}
      const now = Date.now()

      forEach(xostors, xostor => {
        const xostorId = xostor.id
        const hosts = hostsByPoolId[xostor.$pool]

        const alerts = []
        let supportEnabled = true

        hosts.forEach(host => {
          const hostId = host.id
          const xostorLicenses = xostorLicensesByBoundObjectId[hostId]

          if (xostorLicenses === undefined) {
            supportEnabled = false
            alerts.push({
              level: 'danger',
              render: <p>{_('hostHasNoXostorLicense', { host: <HostItem id={hostId} /> })}</p>,
            })
          }

          if (xostorLicenses?.length > 1) {
            alerts.push({
              level: 'warning',
              render: (
                <p>
                  {_('hostBoundToMultipleXostorLicenses', { host: <HostItem id={hostId} /> })}
                  <br />
                  {xostorLicenses.map(license => license.id.slice(-4)).join(',')}
                </p>
              ),
            })
          }

          const expiredXostorLicenses = xostorLicenses?.filter(license => license.expires < now)
          if (expiredXostorLicenses?.length > 0) {
            let level = 'warning'
            if (expiredXostorLicenses.length === xostorLicenses.length) {
              supportEnabled = false
              level = 'danger'
            }
            alerts.push({
              level,
              render: (
                <p>
                  {_('licenseExpiredXostorWarning', {
                    licenseIds: expiredXostorLicenses.map(license => license.id.slice(-4)).join(','),
                    nLicenseIds: expiredXostorLicenses.length,
                    host: <HostItem id={hostId} />,
                  })}
                </p>
              ),
            })
          }
        })

        xostorLicenseInfoByXostorId[xostorId] = {
          alerts,
          supportEnabled,
        }
      })

      return xostorLicenseInfoByXostorId
    },
    licenseNearExpiration:  (_, { selfLicences }) => getLicenseNearExpiration(selfLicences)
  },
})
export default class XoApp extends Component {
  static contextTypes = {
    router: PropTypes.object,
  }
  static childContextTypes = {
    shortcuts: PropTypes.object.isRequired,
  }
  getChildContext = () => ({ shortcuts: shortcutManager })

  state = {
    dismissedSourceBanner: Boolean(cookies.get('dismissedSourceBanner')),
    dismissedTrialBanner: Boolean(cookies.get('dismissedTrialBanner')),
    dismissedNearExpirationBanner: cookies.get('dismissedNearExpirationBanner'),
  }

  displayOpenSourceDisclaimer() {
    const previousDisclaimer = cookies.get('previousDisclaimer')
    const now = Math.floor(Date.now() / 1e3)
    const oneWeekAgo = now - 7 * 24 * 3600
    if (!previousDisclaimer || previousDisclaimer < oneWeekAgo) {
      alert(
        _('disclaimerTitle'),
        <div>
          <p>{_('disclaimerText1')}</p>
          <p>
            {_('disclaimerText2')}{' '}
            <a
              href='https://vates.tech/deploy/?pk_campaign=xoa_source_upgrade&pk_kwd=ossmodal'
              target='_blank'
              rel='noreferrer'
            >
              XOA (turnkey appliance)
            </a>
          </p>
          <p>{_('disclaimerText3')}</p>
        </div>
      )
      cookies.set('previousDisclaimer', now)
    }
  }

  displayOExpirationIsNear() {
    const previousDisclaimer = cookies.get('dismissedSourceBanner')
    const now = Math.floor(Date.now() / 1e3)
    const oneWeekAgo = now - 7 * 24 * 3600
    if (!previousDisclaimer || previousDisclaimer < oneWeekAgo) {
      alert(
        _('disclaimerTitle'),
        <div>
          <p>{_('disclaimerText1')}</p>
          <p>
            {_('disclaimerText2')}{' '}
            <a
              href='https://vates.tech/deploy/?pk_campaign=xoa_source_upgrade&pk_kwd=ossmodal'
              target='_blank'
              rel='noreferrer'
            >
              XOA (turnkey appliance)
            </a>
          </p>
          <p>{_('disclaimerText3')}</p>
        </div>
      )
      cookies.set('previousDisclaimer', now)
    }
  }

  dismissSourceBanner = () => {
    cookies.set('dismissedSourceBanner', true, { expires: 1 }) // 1 day
    this.setState({ dismissedSourceBanner: true })
  }

  dismissTrialBanner = () => {
    cookies.set('dismissedTrialBanner', true, { expires: 1 })
    this.setState({ dismissedTrialBanner: true })
  }

  dismissNearExpirationBanner = ({strCode}) => {
    cookies.set('dismissedNearExpirationBanner', strCode, { expires: 100 /* more than the total duration of the warnings */ })
    this.setState({ dismissedNearExpirationBanner: strCode })
  }

  componentDidMount() {
    this.refs.bodyWrapper.style.minHeight = this.refs.menu.getWrappedInstance().height + 'px'
    if (+process.env.XOA_PLAN === 5) {
      this.displayOpenSourceDisclaimer()
    }
  }

  componentDidUpdate(prev) {
    if (prev.location.pathname !== this.props.location.pathname) {
      Modal.close()
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
          <span>
            <Icon icon='shortcuts' /> {_('shortcutModalTitle')}
          </span>,
          <Container>
            {map(
              help,
              (context, contextKey) =>
                context.name && [
                  <Row className='mt-1' key={contextKey}>
                    <Col>
                      <h4>{context.name}</h4>
                    </Col>
                  </Row>,
                  ...map(
                    context.shortcuts,
                    ({ message, keys }, key) =>
                      message && (
                        <Row key={`${contextKey}_${key}`}>
                          <Col size={2} className='text-xs-right'>
                            <strong>{Array.isArray(keys) ? keys[0] : keys}</strong>
                          </Col>
                          <Col size={10}>{message}</Col>
                        </Row>
                      )
                  ),
                ]
            )}
          </Container>
        )
        break
    }
  }

  render() {
    const { signedUp, trial, registerNeeded } = this.props
    const { pathname } = this.context.router.location
    // If we are under expired or unstable trial (signed up only)
    const blocked =
      signedUp && blockXoaAccess(trial) && !(pathname.startsWith('/xoa/') || pathname === '/backup/restore')
    const plan = getXoaPlan()

    return (
      <IntlProvider>
        <ThemeProvider theme={themes.base}>
          <DocumentTitle title='Xen Orchestra'>
            <div>
              {plan !== 'Community' && registerNeeded && (
                <div className='alert alert-danger mb-0'>
                  {_('notRegisteredDisclaimerInfo')}{' '}
                  <a href='https://xen-orchestra.com/#!/signup' rel='noopener noreferrer' target='_blank'>
                    {_('notRegisteredDisclaimerCreateAccount')}
                  </a>{' '}
                  <Link to='/xoa/update'>{_('notRegisteredDisclaimerRegister')}</Link>
                </div>
              )}
              {plan === 'Community' && !this.state.dismissedSourceBanner && (
                <div className='alert alert-danger mb-0'>
                  <a
                    href='https://vates.tech/deploy/?pk_campaign=xo_source_banner'
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    {_('disclaimerText3')}
                  </a>{' '}
                  <a
                    href='https://xen-orchestra.com/docs/installation.html#banner-and-warnings'
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    {_('disclaimerText4')}
                  </a>
                  <button className='close' onClick={this.dismissSourceBanner}>
                    &times;
                  </button>
                </div>
              )}
              {isTrialRunning(trial.trial) && !this.state.dismissedTrialBanner && (
                <div className='alert alert-info mb-0'>
                  {_('trialLicenseInfo', {
                    edition: getXoaPlan(productId2Plan[trial.trial.productId]),
                    date: new Date(trial.trial.end),
                  })}
                  <button className='close' onClick={this.dismissTrialBanner}>
                    &times;
                  </button>
                </div>
              )}
              {this.state.licenseNearExpiration  && this.state.dismissedNearExpirationBanner !== this.state.licenseNearExpiration.code && (
                <div className='alert alert-info mb-0'>
                  {_(this.state.licenseNearExpiration.strCode, {
                    duration: this.state.licenseNearExpiration.textDuration,
                    date: new Date(this.state.licenseNearExpiration.license.expires),
                  })}
                  <button className='close' onClick={()=>this.dismissNearExpirationBanner(this.state.licenseNearExpiration.strCode)}>
                    &times;
                  </button>
                </div>
              )}
              <div style={CONTAINER_STYLE}>
                <Shortcuts
                  name='XoApp'
                  handler={this._shortcutsHandler}
                  targetNodeSelector='body'
                  stopPropagation={false}
                />
                <Menu ref='menu' />
                <div ref='bodyWrapper' style={BODY_WRAPPER_STYLE}>
                  <div style={BODY_STYLE}>
                    {blocked ? <XoaUpdates /> : signedUp ? this.props.children : <p>Still loading</p>}
                  </div>
                </div>
                <Modal />
                <FormModal />
                <Notification />
                <TooltipViewer />
              </div>
            </div>
          </DocumentTitle>
        </ThemeProvider>
      </IntlProvider>
    )
  }
}
