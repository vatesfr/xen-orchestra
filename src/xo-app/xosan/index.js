import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import Page from '../page'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { connectStore, formatSize } from 'utils'
import { Container, Col } from 'grid'
import { Toggle } from 'form'
import {
  every,
  filter,
  isEmpty,
  keys,
  map,
  pickBy
} from 'lodash'
import {
  createGetObjectsOfType,
  createGroupBy,
  createSelector,
  createSort
} from 'selectors'
import { SelectPif } from 'select-objects'
import {
  getVolumeInfo,
  createXosanSR,
  computeXosanPossibleOptions
} from 'xo'

// ==================================================================

const HEADER = <Container>
  <h2><Icon icon='menu-xosan' /> Xen Orchestra Storage Area Network</h2>
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

  componentDidMount () {
    if (this.props.xosansrs && this.props.xosansrs.length > 0) {
      Promise.all(this.props.xosansrs.map(sr => getVolumeInfo(sr.id))).then(volumes => {
        const volumeConfig = {}
        volumes.forEach((volume, index) => {
          volumeConfig[this.props.xosansrs[index].id] = volume
        })
        this.setState({
          volumeConfig
        })
      })
    }
  }

  render () {
    const { xosansrs } = this.props
    return <div>
      <h2>Xen Orchestra SAN SR</h2>
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Hosts</th>
            <th>Volume ID</th>
            <th>Size</th>
            <th>Used Space</th>
          </tr>
        </thead>
        <tbody>
          {map(xosansrs, sr => {
            const configsMap = {}
            sr.PBDs.forEach(pbd => { configsMap[pbd.device_config['server']] = true })
            return <tr key={sr.id}>
              <td>
                <Link to={`/srs/${sr.id}/xosan`}>{sr.name_label}</Link>
              </td>
              <td>
                { sr.PBDs.map(pbd => pbd.realHost.name_label).join(', ') }
              </td>
              <td>
                { this.state.volumeConfig && this.state.volumeConfig[sr.id]['Volume ID'] }
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

class PoolAvailableSrs extends Component {
  state = {
    glusterType: 'disperse',
    selectedSrs: {}
  }

  _selectSr = (event, srId) => {
    const selectedSrs = { ...this.state.selectedSrs }
    selectedSrs[srId] = event.target.checked
    this.setState({ selectedSrs })

    computeXosanPossibleOptions(keys(pickBy(selectedSrs))).then(suggestions => {
      this.setState({ suggestions })
    })
  }

  _getPifPredicate = createSelector(
    () => this.props.pool && this.props.pool.id,
    poolId => pif => pif.vlan === -1 && pif.$pool === poolId
  )

  _getNSelectedSrs = createSelector(
    () => this.state.selectedSrs,
    srs => filter(srs).length
  )

  _createXosanVm = () => {
    const { pif, vlan, glusterType, selectedSrs, redundancy } = this.state

    return createXosanSR(pif, vlan || 0, keys(pickBy(selectedSrs)), glusterType, redundancy)
  }

  render () {
    const { pool, lvmsrs } = this.props
    const {
      glusterType,
      pif,
      selectedSrs,
      suggestions,
      useVlan,
      vlan
    } = this.state

    if (!every(lvmsrs, sr => sr.PBDs[0].realHost.supplementalPacks['vates:XOSAN'])) {
      return <span>Install supplemental packs on all hosts</span> // TODO
    }

    return <div className='mb-3'>
      <h1>Available Raw SRs (lvm) on {pool.name_label}</h1>
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Host</th>
            <th>Size</th>
            <th>Used Space</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {map(lvmsrs, sr => {
            const host = sr.PBDs[0].realHost
            return <tr key={sr.id}>
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
              <td>
                <input
                  checked={selectedSrs[sr.id] || false}
                  onChange={event => this._selectSr(event, sr.id)}
                  type='checkbox'
                />
              </td>
            </tr>
          })}
        </tbody>
      </table>
      <h2>Suggestions</h2>
      {isEmpty(suggestions)
        ? <em>Select at least 2 SRs</em>
        : <table className='table table-striped'>
          <thead>
            <tr>
              <th>Layout</th>
              <th>Redundancy</th>
              <th>Capacity</th>
              <th>Available space</th>
            </tr>
          </thead>
          <tbody>
            {map(suggestions, ({ layout, redundancy, capacity, availableSpace }, index) => <tr key={index}>
              <td>{layout}</td>
              <td>{redundancy}</td>
              <td>{capacity}</td>
              <td>{formatSize(availableSpace)}</td>
            </tr>)}
          </tbody>
        </table>
      }
      <hr />
      <Container>
        <SingleLineRow>
          <Col size={3}>
            <SelectPif
              onChange={this.linkState('pif')}
              predicate={this._getPifPredicate()}
              value={pif}
            />
          </Col>
          <Col size={2}>
            <input
              className='form-control pull-right'
              disabled={!useVlan}
              onChange={this.linkState('vlan')}
              placeholder='VLAN'
              style={{ width: '50%' }}
              type='text'
              value={vlan}
            />
            <Toggle className='pull-right mr-1' onChange={this.linkState('useVlan')} value={useVlan} />
          </Col>
          <Col size={2}>
            <select
              className='form-control'
              id='selectGlusterType'
              onChange={this.linkState('glusterType')}
              required
              value={glusterType}
            >
              <option value='disperse'>disperse</option>
              <option value='replica'>replica</option>
            </select>
          </Col>
          <Col size={2}>
            <input
              className='form-control'
              onChange={this.linkState('redundancy')}
              placeholder='redundancy'
              type='number'
            />
          </Col>
          <Col size={3}>
            <ActionButton
              btnStyle='success'
              disabled={!pif || !glusterType || this._getNSelectedSrs() < 2}
              icon='add'
              handler={this._createXosanVm}
            >
              Create XOSAN VM on selected SRs and PIF
            </ActionButton>
          </Col>
        </SingleLineRow>
      </Container>
    </div>
  }
}

// ==================================================================

@connectStore(() => {
  const pools = createGetObjectsOfType('pool')

  const hosts = createGetObjectsOfType('host').groupBy('$pool')

  const lvmSrsByPool = createGroupBy(createSort(createSelector(
    createGetObjectsOfType('SR').filter([sr => !sr.shared && sr.SR_type === 'lvm']),
    createGetObjectsOfType('PBD').groupBy('SR'),
    createGetObjectsOfType('host'),
    (srs, pbds, hosts) => map(srs, sr => {
      const list = pbds[sr.id]
      sr.PBDs = list || []
      sr.PBDs.forEach(pbd => {
        pbd.realHost = hosts[pbd.host]
      })
      sr.PBDs.sort()
      return sr
    }).filter(sr => Boolean(sr.PBDs.length))
  ), 'name_label'), '$pool')

  const xosanSrsByPool = createGroupBy(createSort(createSelector(
    createGetObjectsOfType('SR').filter([sr => sr.shared && sr.SR_type === 'xosan']),
    createGetObjectsOfType('PBD').groupBy('SR'),
    createGetObjectsOfType('host'),
    (srs, pbds, hosts) => map(srs, sr => {
      const list = pbds[sr.id]
      sr.PBDs = list || []
      sr.PBDs.forEach(pbd => {
        pbd.realHost = hosts[pbd.host]
      })
      sr.PBDs.sort((pbd1, pbd2) => pbd1.realHost.name_label.localeCompare(pbd2.realHost.name_label))
      return sr
    })
  ), 'name_label'), '$pool')

  return {
    hosts,
    pools,
    xosanSrsByPool,
    lvmSrsByPool,
    networks: createGetObjectsOfType('network').groupBy('$pool')
  }
})
export default class Xosan extends Component {
  render () {
    const { pools, xosanSrsByPool, lvmSrsByPool } = this.props

    return <Page header={HEADER} title='xosan' formatTitle>
      <Container>
        {map(pools, pool => {
          const poolXosanSrs = xosanSrsByPool[pool.id]
          const poolLvmSrs = lvmSrsByPool[pool.id]

          return poolXosanSrs && poolXosanSrs.length
            ? <XosanVolumesTable xosansrs={poolXosanSrs} lvmsrs={poolLvmSrs} />
            : <PoolAvailableSrs pool={pool} lvmsrs={poolLvmSrs} />
        })}
      </Container>
    </Page>
  }
}
