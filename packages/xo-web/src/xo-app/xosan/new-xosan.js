import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { get } from '@xen-orchestra/defined'
import { Host, Sr } from 'render-xo-item'
import { Container, Col, Row } from 'grid'
import { Toggle, SizeInput } from 'form'
import { SelectPif, SelectPool } from 'select-objects'
import { filter, forEach, groupBy, isEmpty, map, pickBy, some } from 'lodash'
import { createFilter, createGetObjectsOfType, createSelector, createSort } from 'selectors'
import {
  addSubscriptions,
  isLatestXosanPackInstalled,
  compareVersions,
  connectStore,
  findLatestPack,
  formatSize,
  mapPlus,
} from 'utils'
import {
  computeXosanPossibleOptions,
  createXosanSR,
  updateXosanPacks,
  getResourceCatalog,
  restartHostsAgents,
  subscribeResourceCatalog,
} from 'xo'

import Graph from './graph'

const _findLatestTemplate = templates => {
  let latestTemplate = templates[0]

  forEach(templates, template => {
    if (compareVersions(template.version, latestTemplate.version) > 0) {
      latestTemplate = template
    }
  })

  return latestTemplate
}

const DEFAULT_BRICKSIZE = 100 * 1024 * 1024 * 1024 // 100 GiB
const DEFAULT_MEMORY = 2 * 1024 * 1024 * 1024 // 2 GiB

const XOSAN_SR_COLUMNS = [
  {
    itemRenderer: sr => <Sr id={sr.id} container={false} spaceLeft={false} link />,
    name: _('xosanName'),
    sortCriteria: 'name_label',
  },
  {
    itemRenderer: sr => <Host id={sr.$container} pool={false} link />,
    name: _('xosanHost'),
    sortCriteria: (sr, { hosts }) => hosts[sr.$container].name_label,
  },
  {
    itemRenderer: sr => <span>{formatSize(sr.size)}</span>,
    name: _('xosanSize'),
    sortCriteria: 'size',
  },
  {
    itemRenderer: sr =>
      sr.size > 0 && (
        <Tooltip
          content={_('spaceLeftTooltip', {
            used: String(Math.round((sr.physical_usage / sr.size) * 100)),
            free: formatSize(sr.size - sr.physical_usage),
          })}
        >
          <progress className='progress' max='100' value={(sr.physical_usage / sr.size) * 100} />
        </Tooltip>
      ),
    name: _('xosanUsedSpace'),
    sortCriteria: sr => sr.size - sr.physical_usage,
  },
]

@addSubscriptions({
  catalog: subscribeResourceCatalog,
})
@connectStore({
  pbds: createGetObjectsOfType('PBD'),
  hosts: createGetObjectsOfType('host'),
  srs: createGetObjectsOfType('SR'),
})
export default class NewXosan extends Component {
  state = {
    selectedSrs: [],
    brickSize: DEFAULT_BRICKSIZE,
    ipRange: '172.31.100.0',
    memorySize: DEFAULT_MEMORY,
    suggestion: 0,
  }

  _hasXcpng = createSelector(
    () => this.props.hosts,
    hosts => Object.values(hosts).some(host => host.productBrand === 'XCP-ng')
  )

  _checkPacks = pool =>
    getResourceCatalog().then(
      catalog => {
        if (catalog === undefined || catalog.xosan === undefined) {
          this.setState({
            checkPackError: true,
          })
          return
        }

        const hosts = filter(this.props.hosts, { $pool: pool.id })
        const pack = findLatestPack(catalog.xosan, map(hosts, 'version'))

        if (!isLatestXosanPackInstalled(pack, hosts)) {
          this.setState({
            needsUpdate: true,
          })
        }
      },
      () => {
        this.setState({
          checkPackError: true,
        })
      }
    )

  _updateXosanPacks = pool => updateXosanPacks(pool).then(() => this._checkPacks(pool))

  _selectPool = pool => {
    this.setState({
      brickSize: DEFAULT_BRICKSIZE,
      checkPackError: false,
      memorySize: DEFAULT_MEMORY,
      needsUpdate: false,
      pif: undefined,
      pool,
      selectedSrs: [],
    })

    return this._checkPacks(pool)
  }

  componentDidUpdate() {
    this._refreshSuggestions()
  }

  // Selector that doesn't return anything but updates the suggestions only if necessary
  _refreshSuggestions = createSelector(
    () => this.state.selectedSrs,
    () => this.state.brickSize,
    () => this.state.customBrickSize,
    () => this.state.srsOnSameHost,
    async (selectedSrs, brickSize, customBrickSize, srsOnSameHost) => {
      this.setState({
        suggestion: 0,
        suggestions: !srsOnSameHost
          ? await computeXosanPossibleOptions(selectedSrs, customBrickSize ? brickSize : undefined)
          : [],
      })
    }
  )

  _getIsInPool = createSelector(
    () => this.state.pool != null && this.state.pool.id,
    poolId => obj => obj.$pool === poolId
  )

  _getPbdsBySr = createSelector(
    () => this.props.pbds,
    this._getIsInPool,
    (pbds, isInPool) => groupBy(filter(pbds, isInPool), 'SR')
  )

  _getHosts = createSelector(
    () => this.props.hosts,
    this._getIsInPool,
    (hosts, isInPool) => pickBy(hosts, isInPool)
  )

  // LVM SRs that are connected
  _getLvmSrs = createSort(
    createSelector(
      createFilter(
        () => this.props.srs,
        createSelector(this._getHosts, hosts => sr => {
          let host
          return sr.SR_type === 'lvm' && (host = hosts[sr.$container]) !== undefined && host.power_state === 'Running'
        })
      ),
      this._getPbdsBySr,
      (srs, pbdsBySr) =>
        mapPlus(srs, (sr, push) => {
          let pbds
          if ((pbds = pbdsBySr[sr.id]).length) {
            push({ ...sr, pbds })
          }
        })
    ),
    'name_label'
  )

  _onCustomBrickSizeChange = async event => {
    const customBrickSize = getEventValue(event)
    this.setState({ customBrickSize })
  }

  _onBrickSizeChange = async event => {
    const brickSize = getEventValue(event)
    this.setState({ brickSize })
  }

  _selectSrs = selectedSrs => {
    const { srs } = this.props
    const found = {}
    let container
    this.setState({
      selectedSrs,
      srsOnSameHost: some(selectedSrs, srId => {
        container = get(() => srs[srId].$container)
        return found[container] || ((found[container] = true), false)
      }),
    })
  }

  _getPifPredicate = createSelector(
    () => this.state.pool,
    pool => pif => pif.vlan === -1 && pif.$host === (pool && pool.master)
  )

  _getNSelectedSrs = createSelector(
    () => this.state.selectedSrs,
    srs => srs.length
  )

  _getLatestTemplate = createSelector(
    createFilter(() => this.props.catalog && map(this.props.catalog.xosan), [({ type }) => type === 'xva']),
    _findLatestTemplate
  )

  _getDisableCreation = createSelector(
    () => this.state.srsOnSameHost,
    () => this.state.suggestion,
    () => this.state.suggestions,
    () => this.state.pif,
    this._getNSelectedSrs,
    (srsOnSameHost, suggestion, suggestions, pif, nSelectedSrs) =>
      srsOnSameHost ||
      !suggestions ||
      !suggestions[suggestion] ||
      !pif ||
      nSelectedSrs < 2 ||
      suggestions[suggestion].availableSpace === 0
  )

  _createXosanVm = () => {
    const params = this.state.suggestions[this.state.suggestion]

    if (!params) {
      return
    }

    createXosanSR({
      template: this._getLatestTemplate(),
      pif: this.state.pif,
      vlan: this.state.vlan || 0,
      srs: this.state.selectedSrs,
      glusterType: params.layout,
      redundancy: params.redundancy,
      brickSize: this.state.customBrickSize ? this.state.brickSize : undefined,
      memorySize: this.state.memorySize,
      ipRange: this.state.customIpRange ? this.state.ipRange : undefined,
    }).then(this.props.onSrCreationFinished)

    this.props.onSrCreationStarted()
  }

  render() {
    if (+process.env.XOA_PLAN === 5) {
      return (
        <em>
          {_('xosanSourcesDisclaimer', {
            link: <a href='https://xen-orchestra.com'>https://xen-orchestra.com</a>,
          })}
        </em>
      )
    }

    const {
      brickSize,
      checkPackError,
      customBrickSize,
      customIpRange,
      ipRange,
      memorySize,
      needsUpdate,
      pif,
      pool,
      srsOnSameHost,
      suggestion,
      suggestions,
      useVlan,
      vlan,
    } = this.state

    const { hostsNeedRestartByPool, poolPredicate, notRegistered } = this.props

    if (notRegistered) {
      return (
        <em>
          {_('xosanUnregisteredDisclaimer', {
            link: <Link to='/xoa/update'>{_('registerNow')}</Link>,
          })}
        </em>
      )
    }

    const hostsNeedRestart = pool != null && hostsNeedRestartByPool !== undefined && hostsNeedRestartByPool[pool.id]
    const architecture = suggestions != null && suggestions[suggestion]

    return (
      <Container>
        {this._hasXcpng() && (
          <Row className='mb-1'>
            <span className='text-muted'>
              <Icon icon='info' />{' '}
              {_('xosanXcpngWarning', {
                link: (
                  <a href='https://xcp-ng.org/docs/storage.html#xosanv2' rel='noopener noreferrer' target='_blank'>
                    https://xcp-ng.org/docs/storage.html
                  </a>
                ),
              })}
            </span>
          </Row>
        )}
        <Row className='mb-1'>
          <Col size={4}>
            <SelectPool onChange={this._selectPool} predicate={poolPredicate} value={pool} />
          </Col>
          <Col size={4}>
            <SelectPif
              disabled={pool == null || needsUpdate || !isEmpty(hostsNeedRestart)}
              onChange={this.linkState('pif')}
              predicate={this._getPifPredicate()}
              value={pif}
            />
          </Col>
        </Row>
        {pool != null &&
          (checkPackError ? (
            <em>{_('xosanPackUpdateError')}</em>
          ) : needsUpdate ? (
            <Row>
              <Col>
                <Icon icon='error' /> {_('xosanNeedPack')}
                <br />
                <ActionButton btnStyle='success' handler={this._updateXosanPacks} handlerParam={pool} icon='export'>
                  {_('xosanInstallIt')}
                </ActionButton>
              </Col>
            </Row>
          ) : !isEmpty(hostsNeedRestart) ? (
            <Row>
              <Col>
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
              </Col>
            </Row>
          ) : (
            [
              <Row key='lvm-srs'>
                <Col>
                  <SortedTable
                    collection={this._getLvmSrs()}
                    columns={XOSAN_SR_COLUMNS}
                    data-hosts={this._getHosts()}
                    onSelect={this._selectSrs}
                    stateUrlParam='s_srs'
                  />
                </Col>
              </Row>,
              <Row key='warning'>
                <Col>
                  {srsOnSameHost && (
                    <span className='text-danger'>
                      <Icon icon='alarm' /> {_('xosanSrOnSameHostMessage')}
                    </span>
                  )}
                </Col>
              </Row>,
              <Row key='suggestions'>
                <Col>
                  {!isEmpty(suggestions) && (
                    <div>
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
                          {map(suggestions, ({ layout, redundancy, capacity, availableSpace }, index) => (
                            <tr key={index}>
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
                              <td>
                                {availableSpace === 0 ? (
                                  <strong className='text-danger'>0</strong>
                                ) : (
                                  formatSize(availableSpace)
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {architecture.layout === 'disperse' && (
                        <div className='alert alert-danger'>
                          {_('xosanDisperseWarning', {
                            link: (
                              <a href='https://xen-orchestra.com/docs/xosan.html#xosan-types'>
                                https://xen-orchestra.com/docs/xosan.html#xosan-types
                              </a>
                            ),
                          })}
                        </div>
                      )}
                      <Graph
                        height={160}
                        layout={architecture.layout}
                        nSrs={this._getNSelectedSrs()}
                        redundancy={architecture.redundancy}
                        width={600}
                      />
                      <hr />
                      <Toggle onChange={this.toggleState('showAdvanced')} value={this.state.showAdvanced} />{' '}
                      {_('xosanAdvanced')}{' '}
                      {this.state.showAdvanced && (
                        <Container className='mb-1'>
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
                            <Col>{_('xosanCustomIpNetwork')}</Col>
                          </SingleLineRow>
                          <SingleLineRow>
                            <Col size={1}>
                              <Toggle onChange={this.linkState('customIpRange')} value={customIpRange} />
                            </Col>
                            <Col size={3}>
                              <input
                                className='form-control'
                                disabled={!customIpRange}
                                onChange={this.linkState('ipRange')}
                                placeholder='ipRange'
                                type='text'
                                value={ipRange}
                              />
                            </Col>
                          </SingleLineRow>
                          <SingleLineRow>
                            <Col>{_('xosanBrickSize')}</Col>
                          </SingleLineRow>
                          <SingleLineRow>
                            <Col size={1}>
                              <Toggle
                                className='mr-1'
                                onChange={this._onCustomBrickSizeChange}
                                value={customBrickSize}
                              />
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
                        </Container>
                      )}
                      <hr />
                    </div>
                  )}
                </Col>
              </Row>,
              <Row key='new-xosan'>
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
              </Row>,
            ]
          ))}
        <hr />
      </Container>
    )
  }
}
