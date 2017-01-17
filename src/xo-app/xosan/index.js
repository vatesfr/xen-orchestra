import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import fromPairs from 'lodash/fromPairs'
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
import {
  getVolumeInfo
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
      const allPbdsConfigs = [].concat.apply([], this.props.xosansrs.map(sr => sr.PBDs)).map(pbd => pbd.device_config['server'])
      const allPbdsConfigsMap = {}
      allPbdsConfigs.forEach(config => { allPbdsConfigsMap[config] = true })

      const allPbdConfigsArray = Object.keys(allPbdsConfigsMap)
      Promise.all(map(allPbdConfigsArray, pbdConfig => getVolumeInfo.apply(null, pbdConfig.split(':/'))))
        .then(volumes => {
          const volumesByID = {}
          volumes.forEach(volume => { volumesByID[volume['Volume ID']] = volume })
          const partialState = {
            volumesByConfig: fromPairs(volumes.map((pool, index) => [allPbdConfigsArray[index], pool])),
            volumesByID
          }
          this.setState(partialState)
        }).catch(e => { console.log('error', e) })
    }
  }

  render () {
    const {xosansrs} = this.props
    return <div>
      <h1>Xen Orchestra SAN SRs</h1>
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Hosts</th>
            <th>SAN Hosts</th>
            <th>Size</th>
            <th>Used Space</th>
          </tr>
        </thead>
        <tbody>
          {map(xosansrs, sr => {
            const configsMap = {}
            sr.PBDs.forEach(pbd => { configsMap[pbd.device_config['server']] = true })
            const configs = Object.keys(configsMap)
            return <tr key={sr.id}>
              <td>
                <Link to={`/srs/${sr.id}/xosan`}>{sr.name_label}</Link>
              </td>
              <td>
                { sr.PBDs.map(pbd => pbd.realHost.name_label).join(', ') }
              </td>
              <td>
                { this.state.volumesByConfig && this.state.volumesByConfig[configs[0]]['Volume ID'] }
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
                  <progress style={{margin: 0}} className='progress' value={(sr.physical_usage / sr.size) * 100}
                    max='100' />
                </Tooltip>
                }
              </td>
            </tr>
          })}
        </tbody>
      </table>
      { this.state.volumesByID && <div>
        <h1>Discovered Gluster Volumes</h1>
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Status</th>
              <th>Type</th>
              <th>Number of Bricks</th>
              <th>Bricks</th>
            </tr>
          </thead>
          <tbody>
            {map(this.state.volumesByID, volume => <tr>
              <td>{volume['Volume Name']}</td>
              <td>{volume['Volume ID']}</td>
              <td>{volume['Status']}</td>
              <td>{volume['Type']}</td>
              <td>{volume['Number of Bricks']}</td>
              <td>
                <ul>{map(volume['Bricks'], brick => {
                  const vif = Object.values(this.props.vifs).find(vif => vif['MAC'] === brick.mac)
                  const vm = this.props.vms[vif['$VM']]
                  const vbds = vm['$VBDs'].map(vbd => this.props.vbds[vbd])
                  const vdi = vbds.map(vbd => this.props.vdis[vbd['VDI']]).find(vdi => vdi && vdi.name_label === 'data')
                  const sr = this.props.lvmsrs.find(sr => sr.id === vdi['$SR'])
                  const host = sr.PBDs[0].realHost
                  return <li><Link to={`/vms/${vm.id}/general`}>{vm.name_label}</Link> - <Link
                    to={`/srs/${sr.id}/general`}>{sr.name_label}</Link> - <Link
                      to={`/hosts/${host.id}/general`}>{host.name_label}</Link> ({brick.config})
                    </li>
                })}</ul>
              </td>
            </tr>
            )}
          </tbody>
        </table>
      </div>
      }
    </div>
  }
}
@connectStore(() => {
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
    })
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
    xosansrs,
    lvmsrs
  }
})

export default class Xosan extends Component {
  render () {
    const {lvmsrs} = this.props
    return <Page header={HEADER} title='xosan' formatTitle>
      <Container>
        {this.props.xosansrs.length && <XosanVolumesTable xosansrs={this.props.xosansrs} lvmsrs={lvmsrs} />}
        <h1>Available Raw SRs (lvm)</h1>
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Hosts</th>
              <th>Size</th>
              <th>Used Space</th>
            </tr>
          </thead>
          <tbody>
            {map(lvmsrs, sr => {
              return <tr key={sr.id}>
                <td>
                  <Link to={`/srs/${sr.id}/general`}>{sr.name_label}</Link>
                </td>
                <td>
                  { sr.PBDs.map(pbd => pbd.realHost.name_label).join(', ') }
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
                    <progress style={{margin: 0}} className='progress' value={(sr.physical_usage / sr.size) * 100}
                      max='100' />
                  </Tooltip>
                  }
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </Container>
    </Page>
  }
}
