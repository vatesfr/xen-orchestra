import _ from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import Link from 'link'
import Page from '../page'
import React from 'react'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Container, Col, Row } from 'grid'
import { Toggle, SizeInput } from 'form'
import { SelectPif, SelectPool } from 'select-objects'
import {
  every,
  filter,
  find,
  forEach,
  groupBy,
  isEmpty,
  keys,
  map,
  mapValues,
  pickBy,
  some
} from 'lodash'
import {
  createFilter,
  createGetObjectsOfType,
  createSelector,
  createSort
} from 'selectors'
import {
  addSubscriptions,
  compareVersions,
  connectStore,
  formatSize,
  isXosanPack,
  mapPlus
} from 'utils'
import {
  computeXosanPossibleOptions,
  createXosanSR,
  deleteSr,
  downloadAndInstallXosanPack,
  getVolumeInfo,
  registerXosan,
  restartHostsAgents,
  subscribeIsInstallingXosan,
  subscribePlugins,
  subscribeResourceCatalog
} from 'xo'

import Graph from './graph'

// ==================================================================

const HEADER = <Container>
  <h2><Icon icon='menu-xosan' /> {_('xosanTitle')}</h2>
</Container>

// ==================================================================

const XOSAN_COLUMNS = [
  {
    name: _('xosanSize'),
    itemRenderer: (sr, { isInstallingXosan, status }) => {
      if (isInstallingXosan && isInstallingXosan[sr.pool && sr.pool.id]) {
        return <Icon icon='loading' />
      }

      if ((status && !every(status[sr.id])) || !every(map(sr.pbds, 'attached'))) {
        return <Icon icon='halted' />
      }

      return <Icon icon='running' />
    }
  },
  {
    name: _('xosanPool'),
    itemRenderer: sr => sr.pool.name_label,
    sortCriteria: sr => sr.pool.name_label
  },
  {
    name: _('xosanName'),
    itemRenderer: sr => <Link to={`/srs/${sr.id}`}>{sr.name_label}</Link>,
    sortCriteria: sr => sr.name_label
  },
  {
    name: _('xosanHosts'),
    itemRenderer: sr => sr.hosts.join(', ')
  },
  {
    name: _('xosanSize'),
    itemRenderer: sr => formatSize(sr.size),
    sortCriteria: sr => sr.size
  },
  {
    name: _('xosanUsedSpace'),
    itemRenderer: sr => sr.size > 0
      ? <Tooltip content={_('spaceLeftTooltip', {
        used: String(Math.round((sr.physical_usage / sr.size) * 100)),
        free: formatSize(sr.size - sr.physical_usage)
      })}>
        <progress
          className='progress'
          max='100'
          value={(sr.physical_usage * 100) / sr.size}
        />
      </Tooltip>
      : null,
    sortCriteria: sr => sr.size
  },
  {
    name: 'Delete',
    itemRenderer: sr => <ActionRowButton
      btnStyle='danger'
      icon='delete'
      handler={deleteSr}
      handlerParam={sr.id}
    />
  }
]

const GIGABYTE = 1024 * 1024 * 1024

const _findLatestTemplate = templates => {
  let latestTemplate = templates[0]

  forEach(templates, template => {
    if (compareVersions(template.version, latestTemplate.version) > 0) {
      latestTemplate = template
    }
  })

  return latestTemplate
}

@addSubscriptions({
  catalog: subscribeResourceCatalog
})
@connectStore({
  pbds: createGetObjectsOfType('PBD'),
  hosts: createGetObjectsOfType('host'),
  srs: createGetObjectsOfType('SR')
})
class NewXosan extends Component {
  state = {
    selectedSrs: {},
    brickSize: 100 * GIGABYTE,
    memorySize: 2 * GIGABYTE
  }

  _selectPool = pool => {
    this.setState({
      selectedSrs: {},
      brickSize: 100 * GIGABYTE,
      memorySize: 2 * GIGABYTE,
      pif: undefined,
      pool
    })

    this._refreshSuggestions({ selectedSrs: {}, brickSize: 100 * GIGABYTE })
  }

  _getIsInPool = createSelector(
    () => this.state.pool != null && this.state.pool.id,
    poolId => obj => obj.$pool === poolId
  )

  _getPbdsBySr = createSelector(
    () => this.props.pbds,
    pbds => groupBy(filter(pbds, this._getIsInPool), 'SR')
  )

  _getHosts = createSelector(
    () => this.props.hosts,
    hosts => filter(hosts, this._getIsInPool)
  )

  // LVM SRs that are connected
  _getLvmSrs = createSort(createSelector(
    createFilter(
      () => this.props.srs,
      createSelector(
        this._getHosts,
        this._getIsInPool,
        (hosts, isInPool) =>
          sr =>
            isInPool(sr) &&
            !sr.shared &&
            sr.SR_type === 'lvm' &&
            find(hosts, { id: sr.$container }).power_state === 'Running'
      )
    ),
    this._getPbdsBySr,
    (srs, pbdsBySr) => mapPlus(srs, (sr, push) => {
      let pbds
      if ((pbds = pbdsBySr[sr.id]).length) {
        push({ ...sr, pbds })
      }
    })
  ), 'name_label')

  _refreshSuggestions = async ({ selectedSrs = this.state.selectedSrs, brickSize = this.state.brickSize }) => {
    this.setState({
      suggestion: 0,
      suggestions: await computeXosanPossibleOptions(keys(pickBy(selectedSrs)), brickSize)
    })
  }

  _onBrickSizeChange = async event => {
    const brickSize = getEventValue(event)
    this.setState({ brickSize })
    await this._refreshSuggestions({ brickSize })
  }

  _selectSr = async (event, sr) => {
    const selectedSrs = { ...this.state.selectedSrs }
    selectedSrs[sr.id] = event.target.checked
    this.setState({ selectedSrs })
    await this._refreshSuggestions({ selectedSrs })
  }

  _getPifPredicate = createSelector(
    () => this.state.pool,
    pool => pif => pif.vlan === -1 && pif.$host === (pool && pool.master)
  )

  _getNSelectedSrs = createSelector(
    () => this.state.selectedSrs,
    srs => filter(srs).length
  )

  _getLatestTemplate = createSelector(
    createFilter(
      () => this.props.catalog && map(this.props.catalog.xosan),
      [ ({ type }) => type === 'xva' ]
    ),
    _findLatestTemplate
  )

  _getDisableSrCheckbox = createSelector(
    () => this.state.selectedSrs,
    this._getLvmSrs,
    (selectedSrs, lvmsrs) => sr =>
      !every(keys(pickBy(selectedSrs)), selectedSrId =>
        selectedSrId === sr.id ||
        find(lvmsrs, { id: selectedSrId }).$container !== sr.$container
      )
  )

  _getDisableCreation = createSelector(
    () => this.state.suggestion,
    () => this.state.suggestions,
    () => this.state.pif,
    this._getNSelectedSrs,
    (suggestion, suggestions, pif, nSelectedSrs) =>
      !suggestions || !suggestions[suggestion] || !pif || nSelectedSrs < 2
  )

  _createXosanVm = () => {
    const params = this.state.suggestions[this.state.suggestion]

    if (!params) {
      return
    }

    return createXosanSR({
      template: this._getLatestTemplate(),
      pif: this.state.pif,
      vlan: this.state.vlan || 0,
      srs: keys(pickBy(this.state.selectedSrs)),
      glusterType: params.layout,
      redundancy: params.redundancy,
      brickSize: this.state.customBrickSize ? this.state.brickSize : undefined,
      memorySize: this.state.memorySize
    }).then(this.props.onSrCreated)
  }

  render () {
    const {
      brickSize,
      customBrickSize,
      memorySize,
      pif,
      pool,
      selectedSrs,
      suggestion,
      suggestions,
      useVlan,
      vlan
    } = this.state

    const {
      hostsNeedRestart,
      noPacksByPool,
      poolPredicate
    } = this.props

    const lvmsrs = this._getLvmSrs()
    const hosts = this._getHosts()

    const disableSrCheckbox = this._getDisableSrCheckbox()

    return <Container className='mb-3'>
      <Row className='mb-1'>
        <Col size={4}>
          <SelectPool
            onChange={this._selectPool}
            predicate={poolPredicate}
            value={pool}
          />
        </Col>
        <Col size={4}>
          <SelectPif
            disabled={pool == null || noPacksByPool[pool.id] || !isEmpty(hostsNeedRestart)}
            onChange={this.linkState('pif')}
            predicate={this._getPifPredicate()}
            value={pif}
          />
        </Col>
      </Row>
      {pool != null && noPacksByPool[pool.id] && <Row>
        <Icon icon='error' /> {_('xosanNeedPack')}
        <br />
        <ActionButton
          btnStyle='success'
          handler={downloadAndInstallXosanPack}
          handlerParam={pool}
          icon='export'
        >
          {_('xosanInstallIt')}
        </ActionButton>
      </Row>}
      {!isEmpty(hostsNeedRestart) && <Row>
        <Icon icon='error' /> {_('xosanNeedRestart')}
        <br />
        <ActionButton
          btnStyle='success'
          handler={restartHostsAgents}
          handlerParam={hostsNeedRestart}
          icon='host-restart-agent'
        >
          {_('xosanRestartAgents')}
        </ActionButton>
      </Row>}
      {pool != null && !noPacksByPool[pool.id] && isEmpty(hostsNeedRestart) && [
        <Row>
          <em>{_('xosanSelect2Srs')}</em>
          <table className='table table-striped'>
            <thead>
              <tr>
                <th />
                <th>{_('xosanName')}</th>
                <th>{_('xosanHost')}</th>
                <th>{_('xosanSize')}</th>
                <th>{_('xosanUsedSpace')}</th>
              </tr>
            </thead>
            <tbody>
              {map(lvmsrs, sr => {
                const host = find(hosts, [ 'id', sr.$container ])

                return <tr key={sr.id}>
                  <td>
                    <input
                      checked={selectedSrs[sr.id] || false}
                      disabled={disableSrCheckbox(sr)}
                      onChange={event => this._selectSr(event, sr)}
                      type='checkbox'
                    />
                  </td>
                  <td>
                    <Link to={`/srs/${sr.id}/general`}>{sr.name_label}</Link>
                  </td>
                  <td>
                    <Link to={`/hosts/${host.id}/general`}>{host.name_label}</Link>
                  </td>
                  <td>
                    {formatSize(sr.size)}
                  </td>
                  <td>
                    {sr.size > 0 &&
                    <Tooltip content={_('spaceLeftTooltip', {
                      used: String(Math.round((sr.physical_usage / sr.size) * 100)),
                      free: formatSize(sr.size - sr.physical_usage)
                    })}>
                      <progress
                        className='progress'
                        max='100'
                        value={(sr.physical_usage / sr.size) * 100}
                      />
                    </Tooltip>
                    }
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </Row>,
        <Row>
          {!isEmpty(suggestions) && <div>
            <h3>{_('xosanSuggestions')}</h3>
            <table className='table table-striped'>
              <thead>
                <tr>
                  <th />
                  <th>{_('xosanLayout')}</th>
                  <th>{_('xosanRedundancy')}</th>
                  <th>{_('xosanCapacity')}</th>
                  <th>{_('xosanAvailableSpace')}</th>
                </tr>
              </thead>
              <tbody>
                {map(suggestions, ({ layout, redundancy, capacity, availableSpace }, index) => <tr key={index}>
                  <td>
                    <input
                      checked={+suggestion === index}
                      name={`suggestion_${pool.id}`}
                      onChange={this.linkState('suggestion')}
                      type='radio'
                      value={index}
                    />
                  </td>
                  <td>{layout}</td>
                  <td>{redundancy}</td>
                  <td>{capacity}</td>
                  <td>{formatSize(availableSpace)}</td>
                </tr>)}
              </tbody>
            </table>
            <Graph
              height={160}
              layout={suggestions[suggestion].layout}
              nSrs={this._getNSelectedSrs()}
              redundancy={suggestions[suggestion].redundancy}
              width={600}
            />
            <hr />
            <Toggle
              onChange={this.toggleState('showAdvanced')}
              value={this.state.showAdvanced}
            /> {_('xosanAdvanced')}
            {' '}
            {this.state.showAdvanced && <Container className='mb-1'>
              <SingleLineRow>
                <Col>{_('xosanVlan')}</Col>
              </SingleLineRow>
              <SingleLineRow>
                <Col size={1}>
                  <Toggle onChange={this.linkState('useVlan')} value={useVlan} />
                </Col>
                <Col size={3}>
                  <input
                    className='form-control'
                    disabled={!useVlan}
                    onChange={this.linkState('vlan')}
                    placeholder='VLAN'
                    type='text'
                    value={vlan}
                  />
                </Col>
              </SingleLineRow>
              <SingleLineRow>
                <Col>{_('xosanBrickSize')}</Col>
              </SingleLineRow>
              <SingleLineRow>
                <Col size={1}>
                  <Toggle className='mr-1' onChange={this.linkState('customBrickSize')} value={customBrickSize} />
                </Col>
                <Col size={3}>
                  <SizeInput
                    readOnly={!customBrickSize}
                    value={brickSize}
                    onChange={this._onBrickSizeChange}
                    required
                  />
                </Col>
              </SingleLineRow>
              <SingleLineRow>
                <Col size={4}>
                  <label>{_('xosanMemorySize')}</label>
                  <SizeInput value={memorySize} onChange={this.linkState('memorySize')} required />
                </Col>
              </SingleLineRow>
            </Container>}
            <hr />
          </div>}
        </Row>,
        <Row>
          <Col>
            <ActionButton
              btnStyle='success'
              disabled={this._getDisableCreation()}
              handler={this._createXosanVm}
              icon='add'
            >
              {_('xosanCreate')}
            </ActionButton>
          </Col>
        </Row>
      ]}
    </Container>
  }
}

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host')
  const getHostsByPool = getHosts.groupBy('$pool')
  const getPools = createGetObjectsOfType('pool')

  const noPacksByPool = createSelector(
    getHostsByPool,
    hostsByPool => mapValues(hostsByPool, (poolHosts, poolId) =>
      !every(poolHosts, host => some(host.supplementalPacks, isXosanPack))
    )
  )

  const getPbdsBySr = createGetObjectsOfType('PBD').groupBy('SR')
  const getXosanSrs = createSelector(
    createGetObjectsOfType('SR').filter([ sr => sr.shared && sr.SR_type === 'xosan' ]),
    getPbdsBySr,
    getPools,
    getHosts,
    (srs, pbdsBySr, pools, hosts) =>
      map(srs, sr => ({
        ...sr,
        pbds: pbdsBySr[sr.id],
        pool: find(pools, { id: sr.$pool }),
        hosts: map(pbdsBySr[sr.id], ({ host }) => find(hosts, [ 'id', host ]).name_label),
        config: sr.other_config['xo:xosan_config'] && JSON.parse(sr.other_config['xo:xosan_config'])
      }))
  )

  const getIsMasterOfflineByPool = createSelector(
    getHostsByPool,
    getPools,
    (hostsByPool, pools) => {
      const isMasterOfflineByPool = {}
      forEach(pools, pool => {
        const poolMaster = find(hostsByPool[pool.id], { id: pool.master })
        isMasterOfflineByPool[pool.id] = poolMaster && poolMaster.power_state !== 'Running'
      })
    }
  )

  // Hosts whose toolstack hasn't been restarted since XOSAN-pack installation
  const getHostsNeedRestartByPool = createSelector(
    getHostsByPool,
    getPools,
    (hostsByPool, pools) => {
      const hostsNeedRestartByPool = {}
      forEach(pools, pool => {
        hostsNeedRestartByPool[pool.id] = filter(hostsByPool[pool.id], host =>
          host.power_state === 'Running' &&
          pool.xosanPackInstallationTime !== null &&
          pool.xosanPackInstallationTime > host.agentStartTime
        )
      })
    }
  )

  const getPoolPredicate = createSelector(
    getXosanSrs,
    srs => pool => every(srs, sr => sr.$pool !== pool.id)
  )

  return {
    isMasterOfflineByPool: getIsMasterOfflineByPool,
    hostsNeedRestartByPool: getHostsNeedRestartByPool,
    noPacksByPool,
    poolPredicate: getPoolPredicate,
    pools: getPools,
    xosanSrs: getXosanSrs
  }
})
@addSubscriptions({
  catalog: subscribeResourceCatalog,
  plugins: subscribePlugins
})
export default class Xosan extends Component {
  componentDidMount () {
    this.unsubscribeIsInstallingXosan = map(this.props.pools, pool =>
      subscribeIsInstallingXosan(pool, isInstallingXosan => {
        this.setState({
          isInstallingXosan: {
            ...this.state.isInstallingXosan,
            [pool.id]: isInstallingXosan
          }
        })
      })
    )
  }

  componentWillReceiveProps ({ xosanSrs }) {
    const sr = xosanSrs && xosanSrs[0] && xosanSrs[0].id
    forEach(xosanSrs, ({ id }) => {
      Promise.all([
        getVolumeInfo(sr, 'heal'),
        getVolumeInfo(sr, 'status'),
        getVolumeInfo(sr, 'info'),
        getVolumeInfo(sr, 'statusDetail')
      ]).then(result => {
        this.setState({
          status: { ...this.state.status, [id]: map(result, 'commandStatus') } })
      })
    })
  }

  componentWillUnmount () {
    forEach(this.unsubscribeIsInstallingXosan, unsubscribe => unsubscribe())
  }

  _getError = createSelector(
    () => this.props.plugins,
    () => this.props.catalog,
    (plugins, catalog) => {
      const cloudPlugin = find(plugins, { id: 'cloud' })
      if (!cloudPlugin) {
        return _('xosanInstallCloudPlugin')
      }

      if (!cloudPlugin.loaded) {
        return _('xosanLoadCloudPlugin')
      }

      if (!catalog) {
        return _('xosanLoading')
      }

      const { xosan } = catalog._namespaces
      if (!xosan) {
        return <span><Icon icon='error' /> {_('xosanNotAvailable')}</span>
      }

      if (xosan.available) {
        return <ActionButton handler={registerXosan} btnStyle='primary' icon='add'>{_('xosanRegisterBeta')}</ActionButton>
      }

      if (xosan.pending) {
        return _('xosanSuccessfullyRegistered')
      }
    }
  )

  _onSrCreated = () => this.setState({ showNewXosanForm: false })

  render () {
    const { xosanSrs, noPacksByPool, hostsNeedRestart, poolPredicate } = this.props
    const error = this._getError()

    return <Page header={HEADER} title='xosan' formatTitle>
      {process.env.XOA_PLAN < 5
        ? <Container>
          {error
            ? <em>{error}</em>
            : <div>
              <p>
                <ActionButton
                  btnStyle='primary'
                  handler={this.toggleState('showNewXosanForm')}
                  icon={this.state.showNewXosanForm ? 'minus' : 'plus'}
                >
                  {_('xosanNew')}
                </ActionButton>
              </p>
              <p>
                {this.state.showNewXosanForm && <NewXosan
                  hostsNeedRestart={hostsNeedRestart}
                  noPacksByPool={noPacksByPool}
                  poolPredicate={poolPredicate}
                  onSrCreated={this._onSrCreated}
                />}
              </p>
              <p>
                <SortedTable
                  collection={xosanSrs}
                  columns={XOSAN_COLUMNS}
                  userData={{
                    isInstallingXosan: this.state.isInstallingXosan,
                    status: this.state.status
                  }}
                />
              </p>
            </div>
          }
        </Container>
        : <Container>
          <h2 className='text-danger'>{_('xosanCommunity')}</h2>
          <p>{_('considerSubscribe', { link: <a href='https://xen-orchestra.com'>https://xen-orchestra.com</a> })}</p>
        </Container>
      }
    </Page>
  }
}
