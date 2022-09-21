import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import Link from 'link'
import Page from '../page'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Container, Col, Row } from 'grid'
import { createGetObjectsOfType, createSelector, isAdmin } from 'selectors'
import { every, filter, find, forEach, isEmpty, map } from 'lodash'
import { get } from '@xen-orchestra/defined'
import { addSubscriptions, adminOnly, connectStore, cowSet, formatSize, ShortDate, TryXoa } from 'utils'
import {
  deleteSr,
  getLicenses,
  registerXosan,
  subscribePlugins,
  subscribeResourceCatalog,
  subscribeVolumeInfo,
  updateXosanPacks,
  EXPIRES_SOON_DELAY,
} from 'xo'

import NewXosan from './new-xosan'
import CreationProgress from './creation-progress'

export const INFO_TYPES = ['heal', 'status', 'info', 'statusDetail', 'hosts']

// ==================================================================

const HEADER = (
  <Container>
    <h2>
      <Icon icon='menu-xosan' /> {_('xosanTitle')}
    </h2>
  </Container>
)

// ==================================================================

const XOSAN_COLUMNS = [
  {
    itemRenderer: (sr, { status }) => {
      if (status === undefined || status[sr.id] === undefined) {
        return null
      }

      const pbdsDetached = every(map(sr.pbds, 'attached')) ? null : _('xosanPbdsDetached')
      const badStatus = every(status[sr.id])
        ? null
        : _('xosanBadStatus', {
            badStatuses: (
              <ul>
                {map(status, (_, status) => (
                  <li key={status}>{status}</li>
                ))}
              </ul>
            ),
          })

      if (pbdsDetached != null || badStatus != null) {
        return (
          <Tooltip content={pbdsDetached || badStatus}>
            <Icon icon={pbdsDetached ? 'busy' : 'halted'} />
          </Tooltip>
        )
      }

      return (
        <Tooltip content={_('xosanRunning')}>
          <Icon icon='running' />
        </Tooltip>
      )
    },
  },
  {
    name: _('xosanPool'),
    itemRenderer: sr => (sr.pool == null ? null : <Link to={`/pools/${sr.pool.id}`}>{sr.pool.name_label}</Link>),
    sortCriteria: sr => sr.pool && sr.pool.name_label,
  },
  {
    name: _('xosanName'),
    itemRenderer: sr => <Link to={`/srs/${sr.id}`}>{sr.name_label}</Link>,
    sortCriteria: sr => sr.name_label,
  },
  {
    name: _('xosanHosts'),
    itemRenderer: sr => (
      <span>
        {map(sr.hosts, (host, i) => [
          i ? ', ' : null,
          <Link key={host.id} to={`/hosts/${host.id}`}>
            {host.name_label}
          </Link>,
        ])}
      </span>
    ),
  },
  {
    name: _('xosanSize'),
    itemRenderer: sr => formatSize(sr.size),
    sortCriteria: sr => sr.size,
  },
  {
    name: _('xosanUsedSpace'),
    itemRenderer: sr =>
      sr.size > 0 ? (
        <Tooltip
          content={_('spaceLeftTooltip', {
            used: String(Math.round((sr.physical_usage * 100) / sr.size)),
            free: formatSize(sr.size - sr.physical_usage),
          })}
        >
          <progress className='progress' max='100' value={(sr.physical_usage * 100) / sr.size} />
        </Tooltip>
      ) : null,
    sortCriteria: sr => (sr.physical_usage * 100) / sr.size,
  },
  {
    name: _('license'),
    itemRenderer: (sr, { isAdmin, licensesByXosan, licenseError }) => {
      if (licenseError !== undefined) {
        return
      }

      const license = licensesByXosan[sr.id]

      // XOSAN not bound to any license, not even trial
      if (license === undefined) {
        return (
          <span className='text-danger'>
            {_('xosanUnknownSr')} <a href='https://xen-orchestra.com/'>{_('contactUs')}</a>
          </span>
        )
      }

      // XOSAN bound to multiple licenses
      if (license === null) {
        return (
          <span className='text-danger'>
            {_('xosanMultipleLicenses')} <a href='https://xen-orchestra.com/'>{_('contactUs')}</a>
          </span>
        )
      }

      const now = Date.now()
      const expiresSoon = license.expires - now < EXPIRES_SOON_DELAY
      const expired = license.expires < now
      return license.productId === 'xosan' ? (
        <span>
          {license.expires === undefined ? (
            '✔'
          ) : expired ? (
            <span>
              {_('licenseHasExpired')} {isAdmin && <Link to='/xoa/licenses'>{_('updateLicenseMessage')}</Link>}
            </span>
          ) : (
            <span className={expiresSoon && 'text-danger'}>
              {_('licenseExpiresDate', {
                date: <ShortDate timestamp={license.expires} />,
              })}{' '}
              {expiresSoon && isAdmin && <Link to='/xoa/licenses'>{_('updateLicenseMessage')}</Link>}
            </span>
          )}
        </span>
      ) : (
        <span>
          {_('xosanNoLicense')} <Link to='/xoa/licenses'>{_('unlockNow')}</Link>
        </span>
      )
    },
  },
]

const XOSAN_INDIVIDUAL_ACTIONS = [
  {
    handler: (xosan, { pools }) => updateXosanPacks(pools[xosan.$pool]),
    icon: 'host-patch-update',
    label: _('xosanUpdatePacks'),
    level: 'primary',
  },
  {
    handler: deleteSr,
    icon: 'delete',
    label: _('xosanDelete'),
    level: 'danger',
  },
]

@adminOnly
@connectStore(() => {
  const getHosts = createGetObjectsOfType('host')
  const getHostsByPool = getHosts.groupBy('$pool')
  const getPools = createGetObjectsOfType('pool')

  const getPbdsBySr = createGetObjectsOfType('PBD').groupBy('SR')
  const getXosanSrs = createSelector(
    createGetObjectsOfType('SR').filter([sr => sr.shared && sr.SR_type === 'xosan']),
    getPbdsBySr,
    getPools,
    getHosts,
    (srs, pbdsBySr, pools, hosts) => {
      return map(srs, sr => ({
        ...sr,
        pbds: pbdsBySr[sr.id],
        pool: find(pools, { id: sr.$pool }),
        hosts: map(pbdsBySr[sr.id], ({ host }) => find(hosts, ['id', host])),
        config: sr.other_config['xo:xosan_config'] && JSON.parse(sr.other_config['xo:xosan_config']),
      }))
    }
  )

  const getIsMasterOfflineByPool = createSelector(getHostsByPool, getPools, (hostsByPool, pools) => {
    const isMasterOfflineByPool = {}
    forEach(pools, pool => {
      const poolMaster = find(hostsByPool[pool.id], { id: pool.master })
      isMasterOfflineByPool[pool.id] = poolMaster && poolMaster.power_state !== 'Running'
    })
  })

  // Hosts whose toolstack hasn't been restarted since XOSAN-pack installation
  const getHostsNeedRestartByPool = createSelector(getHostsByPool, getPools, (hostsByPool, pools) => {
    const hostsNeedRestartByPool = {}
    forEach(pools, pool => {
      hostsNeedRestartByPool[pool.id] = filter(
        hostsByPool[pool.id],
        host =>
          host.power_state === 'Running' &&
          pool.xosanPackInstallationTime !== null &&
          pool.xosanPackInstallationTime > host.agentStartTime
      )
    })

    return hostsNeedRestartByPool
  })

  const getPoolPredicate = createSelector(
    getXosanSrs,
    getHosts,
    (srs, hosts) => pool => hosts[pool.master].productBrand !== 'XCP-ng' && every(srs, sr => sr.$pool !== pool.id)
  )

  return {
    isAdmin,
    isMasterOfflineByPool: getIsMasterOfflineByPool,
    hostsNeedRestartByPool: getHostsNeedRestartByPool,
    poolPredicate: getPoolPredicate,
    pools: getPools,
    xoaRegistration: state => state.xoaRegisterState,
    xosanSrs: getXosanSrs,
  }
})
@addSubscriptions({
  catalog: subscribeResourceCatalog,
  plugins: subscribePlugins,
})
export default class Xosan extends Component {
  componentDidMount() {
    this._updateLicenses().then(() => this._subscribeVolumeInfo(this.props.xosanSrs))
  }

  componentWillReceiveProps({ pools, xosanSrs }) {
    if (xosanSrs !== this.props.xosanSrs) {
      this.unsubscribeVolumeInfo && this.unsubscribeVolumeInfo()
      this._subscribeVolumeInfo(xosanSrs)
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeVolumeInfo != null) this.unsubscribeVolumeInfo()
  }

  _updateLicenses = () =>
    getLicenses({ productType: 'xosan' })
      .then(xosanLicenses => {
        this.setState({
          xosanLicenses,
        })
      })
      .catch(error => {
        this.setState({ licenseError: error })
      })

  _subscribeVolumeInfo = srs => {
    const licensesByXosan = this._getLicensesByXosan()
    const now = Date.now()
    const canAdminXosan = sr => {
      const license = licensesByXosan[sr.id]

      return license !== undefined && (license.expires === undefined || license.expires > now)
    }

    const unsubscriptions = []
    forEach(srs, sr => {
      if (!canAdminXosan(sr)) {
        return
      }
      forEach(INFO_TYPES, infoType =>
        unsubscriptions.push(
          subscribeVolumeInfo({ sr, infoType }, info =>
            this.setState({
              status: cowSet(this.state.status, [sr.id, infoType], info),
            })
          )
        )
      )
    })
    this.unsubscribeVolumeInfo = () => forEach(unsubscriptions, unsubscribe => unsubscribe())
  }

  _getLicensesByXosan = createSelector(
    () => this.state.xosanLicenses,
    (xosanLicenses = []) => {
      const licensesByXosan = {}
      forEach(xosanLicenses, license => {
        let xosanId
        if ((xosanId = license.boundObjectId) === undefined) {
          return
        }
        licensesByXosan[xosanId] =
          licensesByXosan[xosanId] !== undefined
            ? null // XOSAN bound to multiple licenses!
            : license
      })

      return licensesByXosan
    }
  )

  _getError = createSelector(
    () => this.props.plugins,
    plugins => {
      const xoaPlugin = find(plugins, { id: 'xoa' })
      if (!xoaPlugin) {
        return _('xosanInstallCloudPlugin')
      }

      if (!xoaPlugin.loaded) {
        return _('xosanLoadCloudPlugin')
      }
    }
  )

  _onSrCreationStarted = () => this.setState({ showNewXosanForm: false })

  _isXosanRegistered = () => get(() => this.props.catalog._namespaces.xosan.registered)

  _toggleShowNewXosanForm = () => {
    if (this.state.showNewXosanForm) {
      this.setState({ showNewXosanForm: false })
      return
    }

    if (!this._isXosanRegistered()) {
      registerXosan()::ignoreErrors()
    }

    this.setState({ showNewXosanForm: true })
  }

  render() {
    const { hostsNeedRestartByPool, isAdmin, poolPredicate, pools, xoaRegistration, xosanSrs } = this.props
    const { licenseError } = this.state
    const error = this._getError()

    return (
      <Page header={HEADER} title='xosan' formatTitle>
        {process.env.XOA_PLAN < 5 ? (
          <Container>
            {error ? (
              <Row>
                <Col>
                  <em>{error}</em>
                </Col>
              </Row>
            ) : (
              [
                <Row key='new-button' className='mb-1'>
                  <Col>
                    <ActionButton
                      btnStyle='primary'
                      handler={this._toggleShowNewXosanForm}
                      icon={this.state.showNewXosanForm ? 'minus' : 'plus'}
                    >
                      {_('xosanNew')}
                    </ActionButton>
                  </Col>
                </Row>,
                <Row key='new-form'>
                  <Col>
                    {this.state.showNewXosanForm &&
                      (this._isXosanRegistered() ? (
                        <NewXosan
                          hostsNeedRestartByPool={hostsNeedRestartByPool}
                          poolPredicate={poolPredicate}
                          onSrCreationFinished={this._updateLicenses}
                          onSrCreationStarted={this._onSrCreationStarted}
                          notRegistered={get(() => xoaRegistration.state) !== 'registered'}
                        />
                      ) : (
                        <em>{_('statusLoading')}</em>
                      ))}
                  </Col>
                </Row>,
                <Row key='progress'>
                  <Col>
                    {map(this.props.pools, pool => (
                      <CreationProgress key={pool.id} pool={pool} />
                    ))}
                  </Col>
                </Row>,
                licenseError !== undefined && (
                  <Row>
                    <Col>
                      <em className='text-danger'>{_('getLicensesError')}</em>
                    </Col>
                  </Row>
                ),
                <Row key='srs'>
                  <Col>
                    {isEmpty(xosanSrs) ? (
                      <em>{_('xosanNoSrs')}</em>
                    ) : (
                      <SortedTable
                        collection={xosanSrs}
                        columns={XOSAN_COLUMNS}
                        individualActions={XOSAN_INDIVIDUAL_ACTIONS}
                        stateUrlParam='s'
                        userData={{
                          isAdmin,
                          licensesByXosan: this._getLicensesByXosan(),
                          licenseError,
                          pools,
                          status: this.state.status,
                        }}
                      />
                    )}
                  </Col>
                </Row>,
              ]
            )}
          </Container>
        ) : (
          <Container>
            <h2 className='text-info'>{_('xosanCommunity')}</h2>
            <p>
              <TryXoa page='xosan' />
            </p>
          </Container>
        )}
      </Page>
    )
  }
}
