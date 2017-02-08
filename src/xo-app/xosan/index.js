import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import map from 'lodash/map'
import Page from '../page'
import React from 'react'
import Tooltip from 'tooltip'
import { connectStore, formatSize } from 'utils'
import { Container } from 'grid'
import {
  createGetObjectsOfType,
  createSelector,
  createSort
} from 'selectors'
import { SelectPif } from 'select-objects'
import {
  getVolumeInfo,
  createXosanVM
} from 'xo'

const HEADER = <Container>
  <h2><Icon icon='menu-update' /> Xen Orchestra Storage Area Network</h2>
</Container>
@connectStore(() => {
  return {
    vifs: createGetObjectsOfType('VIF'),
    vms: createGetObjectsOfType('VM'),
    vbds: createGetObjectsOfType('VBD'),
    vdis: createGetObjectsOfType('VDI')
  }
})
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
                  <progress style={{ margin: 0 }} className='progress' value={(sr.physical_usage / sr.size) * 100}
                    max='100' />
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
@connectStore(() => {
  const pools = createGetObjectsOfType('pool')

  const hosts = createGetObjectsOfType('host').groupBy('$pool')

  const lvmsrs = createSort(createSelector(
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
  ), 'name_label')

  const xosansrs = createSort(createSelector(
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
  ), 'name_label')
  return {
    hosts,
    pools,
    xosansrs,
    lvmsrs,
    networks: createGetObjectsOfType('network').groupBy('$pool')
  }
})

export default class Xosan extends Component {
  _selectedItems = {}

  _getPifPredicate (pool) {
    return pif => pif.vlan === -1 && pif.$pool === pool.id
  }

  _selectItem = (event) => {
    const id = event.target.value
    !this._selectedItems[id] ? this._selectedItems[id] = true : delete this._selectedItems[id]
  }

  _createXosanVm = () => {
    const pif = this.refs.pif.value
    const vlan = this.refs.vlan.value
    createXosanVM(pif, vlan, Object.keys(this._selectedItems))
  }

  renderPool (pool, xosansrs, lvmsrs) {
    const filteredXosansrs = xosansrs.filter(sr => sr.$pool === pool.id)
    if (filteredXosansrs.length) {
      return <XosanVolumesTable xosansrs={filteredXosansrs} lvmsrs={lvmsrs} />
    } else {
      return <div>
        <h2>Available Raw SRs (lvm)</h2>
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Host</th>
              <th>Size</th>
              <th>Used Space</th>
              <th><ActionButton
                btnStyle='success'
                icon='add'
                handler={this._createXosanVm}
                handlerParam={Object.keys(this._selectedItems)}
              >Create XOSAN VM on selected SRs and PIF</ActionButton>
                <br />
                <SelectPif
                  predicate={this._getPifPredicate(pool)}
                  ref='pif'
                />
                <input type='text' ref='vlan' placeholder='VLAN' />
              </th>
            </tr>
          </thead>
          <tbody>
            {map(lvmsrs.filter(sr => sr.$pool === pool.id), sr => {
              const host = sr.PBDs[0].realHost
              let lastCol = null
              if (host.supplementalPacks['vates:XOSAN']) {
                lastCol = <input type='checkbox' checked={this._selectedItems[sr.id]} onChange={this._selectItem}
                  value={sr.id} />
              } else {
                lastCol = <span>Supplemental Pack XOSAN is not installed on <Link
                  to={`/hosts/${host.id}/advanced`}>host { host.name_label }</Link></span>
              }
              return <tr key={sr.id}>
                <td>
                  <Link to={`/srs/${sr.id}/general`}>{sr.name_label}</Link>
                </td>
                <td>
                  <Link to={`/hosts/${host.id}/general`}>{ host.name_label }</Link>
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
                    <progress style={{ margin: 0 }} className='progress'
                      value={(sr.physical_usage / sr.size) * 100}
                      max='100' />
                  </Tooltip>
                  }
                </td>
                <td>
                  { lastCol }
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    }
  }

  render () {
    const { lvmsrs, pools, xosansrs } = this.props
    return <Page header={HEADER} title='xosan' formatTitle>
      <Container>
        {map(pools, pool => {
          return <div>
            <h1>Pool <i>{pool.name_label}</i></h1>
            {this.renderPool(pool, xosansrs, lvmsrs)}
          </div>
        }
        )}
      </Container>
    </Page>
  }
}
