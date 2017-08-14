import _ from 'intl'
import ActionButton from 'action-button'
import Collapse from 'collapse'
import Component from 'base-component'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import Link from 'link'
import Page from '../page'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { Toggle, SizeInput } from 'form'
import { SelectPif } from 'select-objects'
import {
  every,
  filter,
  find,
  forEach,
  isEmpty,
  keys,
  map,
  mapValues,
  pickBy,
  some,
  sortBy
} from 'lodash'
import {
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
  downloadAndInstallXosanPack,
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

@connectStore(() => ({
  vifs: createGetObjectsOfType('VIF'),
  vms: createGetObjectsOfType('VM'),
  vbds: createGetObjectsOfType('VBD'),
  vdis: createGetObjectsOfType('VDI')
}))
export class XosanVolumesTable extends Component {
  constructor (props) {
    super(props)
    this.state = {
      peers: null,
      volumesByConfig: null,
      volumesByID: null
    }
  }

  render () {
    const { xosansrs, hosts } = this.props
    return <div>
      <h3>{_('xosanSrTitle')}</h3>
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>{_('xosanName')}</th>
            <th>{_('xosanHosts')}</th>
            <th>{_('xosanSize')}</th>
            <th>{_('xosanUsedSpace')}</th>
          </tr>
        </thead>
        <tbody>
          {map(xosansrs, sr => {
            const configsMap = {}
            forEach(sr.pbds, pbd => { configsMap[pbd.device_config['server']] = true })

            return <tr key={sr.id}>
              <td>
                <Link to={`/srs/${sr.id}/xosan`}>{sr.name_label}</Link>
              </td>
              <td>
                { map(sr.pbds, ({ host }) => find(hosts, [ 'id', host ]).name_label).join(', ') }
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
                      style={{ margin: 0 }}
                      value={(sr.physical_usage / sr.size) * 100}
                    />
                  </Tooltip>
                }
              </td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  }
}

// ==================================================================

const _findLatestTemplate = templates => {
  let latestTemplate = templates[0]

  forEach(templates, template => {
    if (compareVersions(template.version, latestTemplate.version) > 0) {
      latestTemplate = template
    }
  })

  return latestTemplate
}

const GIGABYTE = 1024 * 1024 * 1024

class PoolAvailableSrs extends Component {
  state = {
    selectedSrs: {},
    brickSize: 100 * GIGABYTE,
    memorySize: 2 * GIGABYTE
  }

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

  _selectSr = async (event, srId) => {
    const selectedSrs = { ...this.state.selectedSrs }
    selectedSrs[srId] = event.target.checked
    this.setState({ selectedSrs })
    await this._refreshSuggestions({ selectedSrs })
  }

  _getPifPredicate = createSelector(
    () => this.props.pool,
    pool => pif => pif.vlan === -1 && pif.$host === pool.master
  )

  _getNSelectedSrs = createSelector(
    () => this.state.selectedSrs,
    srs => filter(srs).length
  )

  _getLatestTemplate = createSelector(
    () => this.props.templates,
    _findLatestTemplate
  )

  _getDisableSrCheckbox = createSelector(
    () => this.state.selectedSrs,
    () => this.props.lvmsrs,
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
      brickSize: this.state.brickSize,
      memorySize: this.state.memorySize
    })
  }

  render () {
    const {
      hosts,
      lvmsrs,
      pool
    } = this.props
    const {
      pif,
      selectedSrs,
      suggestion,
      suggestions,
      useVlan,
      vlan,
      brickSize,
      memorySize
    } = this.state

    const disableSrCheckbox = this._getDisableSrCheckbox()

    return <div className='mb-3'>
      <h3>{_('xosanAvailableSrsTitle')}</h3>
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
                  onChange={event => this._selectSr(event, sr.id)}
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
      <h3>{_('xosanSuggestions')}</h3>
      {isEmpty(suggestions)
        ? <em>{_('xosanSelect2Srs')}</em>
        : <div>
          <label title='Size of the disk underlying the bricks'>Brick size:</label>
          <SizeInput value={brickSize} onChange={this._onBrickSizeChange} required />
          <label title='Memory size of the VMs underlying the bricks'>Memory size:</label>
          <SizeInput value={memorySize} onChange={this.linkState('memorySize')} required />
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
          <Container>
            <SingleLineRow>
              <Col size={6}>
                <SelectPif
                  onChange={this.linkState('pif')}
                  predicate={this._getPifPredicate()}
                  value={pif}
                />
              </Col>
              <Col size={3}>
                <input
                  className='form-control pull-right'
                  disabled={!useVlan}
                  onChange={this.linkState('vlan')}
                  placeholder='VLAN'
                  style={{ width: '70%' }}
                  type='text'
                  value={vlan}
                />
                <Toggle className='pull-right mr-1' onChange={this.linkState('useVlan')} value={useVlan} />
              </Col>
              <Col size={3}>
                <ActionButton
                  btnStyle='success'
                  className='pull-right'
                  disabled={this._getDisableCreation()}
                  handler={this._createXosanVm}
                  icon='add'
                >
                  {_('xosanCreate')}
                </ActionButton>
              </Col>
            </SingleLineRow>
          </Container>
        </div>
      }
    </div>
  }
}

// ==================================================================

@connectStore(() => {
  const getIsInPool = createSelector(
    (_, { pool }) => pool !== null && pool.id,
    poolId => obj => obj.$pool === poolId
  )

  const getPbdsBySr = createGetObjectsOfType('PBD').filter(getIsInPool).groupBy('SR')
  const getHosts = createGetObjectsOfType('host').filter(getIsInPool)

  // LVM SRs that are connected
  const getLvmSrs = createSort(createSelector(
    createGetObjectsOfType('SR').filter(
      createSelector(
        getHosts,
        getIsInPool,
        (hosts, isInPool) =>
          sr =>
            isInPool(sr) &&
            !sr.shared &&
            sr.SR_type === 'lvm' &&
            find(hosts, { id: sr.$container }).power_state === 'Running'
      )
    ),
    getPbdsBySr,
    (srs, pbdsBySr) => mapPlus(srs, (sr, push) => {
      let pbds
      if ((pbds = pbdsBySr[sr.id]).length) {
        push({ ...sr, pbds })
      }
    })
  ), 'name_label')

  const getXosanSrs = createSort(createSelector(
    createGetObjectsOfType('SR').filter(createSelector(
      (_, { pool }) => pool !== null && pool.id,
      poolId =>
        sr => sr.$pool === poolId && sr.shared && sr.SR_type === 'xosan'
    )),
    getPbdsBySr,
    (srs, pbdsBySr) =>
      map(srs, sr => ({ ...sr, pbds: pbdsBySr[sr.id] }))
  ), 'name_label')

  const getTemplates = createSelector(
    (_, { catalog }) => catalog,
    catalog => filter(catalog.xosan, { type: 'xva' })
  )

  // Hosts whose toolstack hasn't been restarted since XOSAN-pack installation
  const getHostsNeedRestart = createSelector(
    (_, { pool }) => pool && pool.xosanPackInstallationTime,
    getHosts,
    (xosanPackInstallationTime, hosts) => filter(hosts, host =>
      host.power_state === 'Running' &&
      xosanPackInstallationTime !== null &&
      xosanPackInstallationTime > host.agentStartTime
    )
  )

  const getIsMasterOffline = createSelector(
    getHosts,
    (_, { pool }) => pool.master,
    (hosts, id) => find(hosts, { id }).power_state !== 'Running'
  )

  return {
    isMasterOffline: getIsMasterOffline,
    hosts: getHosts,
    lvmSrs: getLvmSrs,
    hostsNeedRestart: getHostsNeedRestart,
    templates: getTemplates,
    xosanSrs: getXosanSrs
  }
})
class Pool extends Component {
  componentDidMount () {
    this.componentWillUnmount = subscribeIsInstallingXosan(this.props.pool, isInstallingXosan => {
      this.setState({ isInstallingXosan })
    })
  }

  render () {
    const { xosanSrs, lvmSrs, hosts, noPack, templates, pool, hostsNeedRestart, isMasterOffline } = this.props
    const { isInstallingXosan } = this.state

    if (isInstallingXosan) {
      return <em><Icon icon='loading' /> {_('xosanInstalling')}</em>
    }

    if (noPack) {
      return <div className='mb-3'>
        <Icon icon='error' /> {_('xosanNeedPack')}
        <br />
        <ActionButton btnStyle='success' icon='export' handler={downloadAndInstallXosanPack} handlerParam={pool}>{_('xosanInstallIt')}</ActionButton>
      </div>
    }

    if (isMasterOffline) {
      return <div className='mb-3'>
        <Icon icon='error' /> {_('xosanMasterOffline')}
      </div>
    }

    if (!isEmpty(hostsNeedRestart)) {
      return <div className='mb-3'>
        <Icon icon='error' /> {_('xosanNeedRestart')}
        <br />
        <ActionButton btnStyle='success' icon='host-restart-agent' handler={restartHostsAgents} handlerParam={hostsNeedRestart}>{_('xosanRestartAgents')}</ActionButton>
      </div>
    }

    return xosanSrs && xosanSrs.length
      ? <XosanVolumesTable hosts={hosts} xosansrs={xosanSrs} lvmsrs={lvmSrs} />
      : <PoolAvailableSrs hosts={hosts} pool={pool} lvmsrs={lvmSrs} templates={templates} />
  }
}

// ==================================================================

@connectStore(() => ({
  pools: createGetObjectsOfType('pool'),
  noPacksByPool: createSelector(
    createGetObjectsOfType('host').groupBy('$pool'),
    hostsByPool => mapValues(hostsByPool, (poolHosts, poolId) =>
      !every(poolHosts, host => some(host.supplementalPacks, isXosanPack))
    )
  )
}))
@addSubscriptions({
  catalog: subscribeResourceCatalog,
  plugins: subscribePlugins
})
export default class Xosan extends Component {
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

  render () {
    const { pools, noPacksByPool, catalog } = this.props
    const sortedPools = sortBy(pools, ['name_label'])
    const error = this._getError()

    return <Page header={HEADER} title='xosan' formatTitle>
      {process.env.XOA_PLAN < 5
        ? <Container>
          {error
            ? <em>{error}</em>
            : map(sortedPools, pool => {
              const noPack = noPacksByPool && noPacksByPool[pool.id]

              return <Collapse key={pool.id} className='mb-1' buttonText={<span>{noPack && <Icon icon='error' />} {pool.name_label}</span>}>
                <div className='m-1'>
                  <Pool pool={pool} noPack={noPack} catalog={catalog} />
                </div>
              </Collapse>
            })
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
