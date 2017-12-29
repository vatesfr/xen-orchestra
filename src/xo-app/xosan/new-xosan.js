import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import SingleLineRow from 'single-line-row'
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
  pickBy,
} from 'lodash'
import {
  createFilter,
  createGetObjectsOfType,
  createSelector,
  createSort,
} from 'selectors'
import {
  addSubscriptions,
  compareVersions,
  connectStore,
  formatSize,
  mapPlus,
} from 'utils'
import {
  computeXosanPossibleOptions,
  createXosanSR,
  downloadAndInstallXosanPack,
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
    selectedSrs: {},
    brickSize: DEFAULT_BRICKSIZE,
    ipRange: '172.31.100.0',
    memorySize: DEFAULT_MEMORY,
  }

  _selectPool = pool => {
    this.setState({
      selectedSrs: {},
      brickSize: DEFAULT_BRICKSIZE,
      memorySize: DEFAULT_MEMORY,
      pif: undefined,
      pool,
    })
  }

  componentDidUpdate () {
    this._refreshSuggestions()
  }

  // Selector that doesn't return anything but updates the suggestions only if necessary
  _refreshSuggestions = createSelector(
    () => this.state.selectedSrs,
    () => this.state.brickSize,
    () => this.state.customBrickSize,
    async (selectedSrs, brickSize, customBrickSize) => {
      this.setState({
        suggestion: 0,
        suggestions: await computeXosanPossibleOptions(
          keys(pickBy(selectedSrs)),
          customBrickSize ? brickSize : undefined
        ),
      })
    }
  )

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
  _getLvmSrs = createSort(
    createSelector(
      createFilter(
        () => this.props.srs,
        createSelector(
          this._getHosts,
          this._getIsInPool,
          (hosts, isInPool) => sr =>
            isInPool(sr) &&
            !sr.shared &&
            sr.SR_type === 'lvm' &&
            find(hosts, { id: sr.$container }).power_state === 'Running'
        )
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

  _selectSr = async (event, sr) => {
    const selectedSrs = { ...this.state.selectedSrs }
    selectedSrs[sr.id] = event.target.checked
    this.setState({ selectedSrs })
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
    createFilter(() => this.props.catalog && map(this.props.catalog.xosan), [
      ({ type }) => type === 'xva',
    ]),
    _findLatestTemplate
  )

  _getDisableSrCheckbox = createSelector(
    () => this.state.selectedSrs,
    this._getLvmSrs,
    (selectedSrs, lvmsrs) => sr =>
      !every(
        keys(pickBy(selectedSrs)),
        selectedSrId =>
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
      srs: keys(pickBy(this.state.selectedSrs)),
      glusterType: params.layout,
      redundancy: params.redundancy,
      brickSize: this.state.customBrickSize ? this.state.brickSize : undefined,
      memorySize: this.state.memorySize,
      ipRange: this.state.customIpRange ? this.state.ipRange : undefined,
    }).then(this.props.onSrCreationFinished)

    this.props.onSrCreationStarted()
  }

  render () {
    if (process.env.XOA_PLAN === 5) {
      return (
        <em>
          {_('xosanSourcesDisclaimer', {
            link: (
              <a href='https://xen-orchestra.com'>https://xen-orchestra.com</a>
            ),
          })}
        </em>
      )
    }

    const {
      brickSize,
      customBrickSize,
      customIpRange,
      ipRange,
      memorySize,
      pif,
      pool,
      selectedSrs,
      suggestion,
      suggestions,
      useVlan,
      vlan,
    } = this.state

    const {
      hostsNeedRestartByPool,
      noPacksByPool,
      poolPredicate,
      notRegistered,
    } = this.props

    if (notRegistered) {
      return (
        <em>
          {_('xosanUnregisteredDisclaimer', {
            link: <Link to='/xoa/update'>{_('registerNow')}</Link>,
          })}
        </em>
      )
    }

    const lvmsrs = this._getLvmSrs()
    const hosts = this._getHosts()

    const disableSrCheckbox = this._getDisableSrCheckbox()
    const hostsNeedRestart =
      pool !== undefined &&
      hostsNeedRestartByPool !== undefined &&
      hostsNeedRestartByPool[pool.id]
    const architecture = suggestions !== undefined && suggestions[suggestion]

    return (
      <Container>
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
              disabled={
                pool == null ||
                noPacksByPool[pool.id] ||
                !isEmpty(hostsNeedRestart)
              }
              onChange={this.linkState('pif')}
              predicate={this._getPifPredicate()}
              value={pif}
            />
          </Col>
        </Row>
        {pool != null &&
          noPacksByPool[pool.id] && (
            <Row>
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
            </Row>
          )}
        {!isEmpty(hostsNeedRestart) && (
          <Row>
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
          </Row>
        )}
        {pool != null &&
          !noPacksByPool[pool.id] &&
          isEmpty(hostsNeedRestart) && [
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
                    const host = find(hosts, ['id', sr.$container])

                    return (
                      <tr key={sr.id}>
                        <td>
                          <input
                            checked={selectedSrs[sr.id] || false}
                            disabled={disableSrCheckbox(sr)}
                            onChange={event => this._selectSr(event, sr)}
                            type='checkbox'
                          />
                        </td>
                        <td>
                          <Link to={`/srs/${sr.id}/general`}>
                            {sr.name_label}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/hosts/${host.id}/general`}>
                            {host.name_label}
                          </Link>
                        </td>
                        <td>{formatSize(sr.size)}</td>
                        <td>
                          {sr.size > 0 && (
                            <Tooltip
                              content={_('spaceLeftTooltip', {
                                used: String(
                                  Math.round(sr.physical_usage / sr.size * 100)
                                ),
                                free: formatSize(sr.size - sr.physical_usage),
                              })}
                            >
                              <progress
                                className='progress'
                                max='100'
                                value={sr.physical_usage / sr.size * 100}
                              />
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Row>,
            <Row>
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
                      {map(
                        suggestions,
                        (
                          { layout, redundancy, capacity, availableSpace },
                          index
                        ) => (
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
                        )
                      )}
                    </tbody>
                  </table>
                  {architecture.layout === 'disperse' && (
                    <div className='alert alert-danger'>
                      {_('xosanDisperseWarning', {
                        link: (
                          <a href='https://xen-orchestra.com/docs/xosan_types.html'>
                            xen-orchestra.com/docs/xosan_types.html
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
                  <Toggle
                    onChange={this.toggleState('showAdvanced')}
                    value={this.state.showAdvanced}
                  />{' '}
                  {_('xosanAdvanced')}{' '}
                  {this.state.showAdvanced && (
                    <Container className='mb-1'>
                      <SingleLineRow>
                        <Col>{_('xosanVlan')}</Col>
                      </SingleLineRow>
                      <SingleLineRow>
                        <Col size={1}>
                          <Toggle
                            onChange={this.linkState('useVlan')}
                            value={useVlan}
                          />
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
                          <Toggle
                            onChange={this.linkState('customIpRange')}
                            value={customIpRange}
                          />
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
                          <SizeInput
                            value={memorySize}
                            onChange={this.linkState('memorySize')}
                            required
                          />
                        </Col>
                      </SingleLineRow>
                    </Container>
                  )}
                  <hr />
                </div>
              )}
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
            </Row>,
          ]}
        <hr />
      </Container>
    )
  }
}
